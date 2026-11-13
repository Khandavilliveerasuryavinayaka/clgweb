import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/lib/api/response';
import { getSupabaseClient } from '@/lib/supabase';
import { supabaseService } from '@/lib/services/supabaseService';
import { User } from '@/types';

// Supported formats & strict upload limits
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);

async function resolveAuthenticatedUser(req: NextRequest): Promise<User | null> {
  const authHeader = req.headers.get('authorization') || '';
  const xUserId = req.headers.get('x-user-id') || '';
  const cookieSession = req.cookies.get('sv_college_session')?.value;

  let identifier: string | null = null;

  if (authHeader.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token.startsWith('jwt-token-')) {
      const parts = token.split('-');
      if (parts.length >= 3) {
        identifier = parts.slice(2, -1).join('-') || parts[2];
      }
    } else {
      identifier = token;
    }
  }

  if (!identifier && xUserId) identifier = xUserId.trim();
  if (!identifier && cookieSession) {
    try {
      const parsed = JSON.parse(cookieSession);
      identifier = parsed.id || parsed.registerNumber;
    } catch {
      identifier = cookieSession;
    }
  }

  if (!identifier) return null;
  return (await supabaseService.getUserById(identifier)) || (await supabaseService.getUserByRegisterNumber(identifier));
}

function validateMagicBytes(buffer: Buffer): { isValid: boolean; detectedType?: string } {
  if (buffer.length < 12) return { isValid: false };
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { isValid: true, detectedType: 'image/jpeg' };
  }
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { isValid: true, detectedType: 'image/png' };
  }
  const isRiff = buffer.toString('ascii', 0, 4) === 'RIFF';
  const isWebp = buffer.toString('ascii', 8, 12) === 'WEBP';
  if (isRiff && isWebp) {
    return { isValid: true, detectedType: 'image/webp' };
  }
  return { isValid: false };
}

// POST: Upload or change student profile picture
export async function POST(req: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedUser(req);
    if (!authenticatedUser) {
      return apiError('Unauthorized: Active authentication session is required.', 401);
    }

    if (authenticatedUser.role !== 'STUDENT') {
      return apiError('Forbidden: Only students are authorized to manage student profile pictures.', 403);
    }

    if (authenticatedUser.accountStatus === 'BLOCKED') {
      return apiError('Forbidden: Blocked student accounts cannot modify profile settings or photos.', 403);
    }

    const studentId = authenticatedUser.id;
    let fileBuffer: Buffer | null = null;
    let fileName = 'profile-picture.jpg';
    let mimeType = 'image/jpeg';

    const contentType = req.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file') as File | null;
      if (!file) return apiError('Bad Request: No photo file attached in upload.', 400);

      fileName = file.name || 'profile-picture.jpg';
      mimeType = file.type || 'image/jpeg';
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuffer);
    } else if (contentType.includes('application/json')) {
      const body = await req.json();
      const { data, filename, contentType: bodyMime } = body;
      if (!data) return apiError('Bad Request: No photo image data provided.', 400);

      fileName = filename || 'profile-picture.jpg';
      mimeType = bodyMime || 'image/jpeg';
      const base64Data = data.includes('base64,') ? data.split('base64,')[1] : data;
      fileBuffer = Buffer.from(base64Data, 'base64');
    } else {
      return apiError('Unsupported content type. Use multipart/form-data or application/json.', 400);
    }

    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return apiError(`Invalid file type (.${ext}). Only JPG, JPEG, PNG, and WebP images are allowed.`, 400);
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return apiError(`Invalid MIME type '${mimeType}'. Allowed: image/jpeg, image/png, image/webp.`, 400);
    }
    if (!fileBuffer || fileBuffer.length === 0) {
      return apiError('Uploaded image file is empty.', 400);
    }
    if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
      return apiError('File size exceeds maximum allowed limit of 5.0 MB.', 400);
    }
    if (!validateMagicBytes(fileBuffer).isValid) {
      return apiError('Corrupt or spoofed image detected. File content does not match allowed image formats.', 400);
    }

    const safeExt = ext === 'jpeg' ? 'jpg' : ext;
    const storageBucket = 'student-profile-pictures';
    const storagePath = `students/${studentId}/profile-picture.${safeExt}`;

    const client = getSupabaseClient();
    const { error: uploadError } = await client.storage
      .from(storageBucket)
      .upload(storagePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      });

    let publicUrl = '';
    if (!uploadError) {
      const { data: publicData } = client.storage
        .from(storageBucket)
        .getPublicUrl(storagePath);
      publicUrl = `${publicData.publicUrl}?v=${Date.now()}`;
    } else {
      // Fallback
      publicUrl = `data:${mimeType};base64,${fileBuffer.toString('base64')}`;
    }

    // Update profile in Supabase
    await client
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        profile_image_path: storagePath,
      })
      .eq('user_id', studentId);

    return apiSuccess({
      profile_image_url: publicUrl,
      profile_image_path: storagePath,
      avatarUrl: publicUrl,
      user: {
        id: authenticatedUser.id,
        registerNumber: authenticatedUser.registerNumber,
        name: authenticatedUser.name,
        role: authenticatedUser.role,
        avatarUrl: publicUrl,
        profileImagePath: storagePath,
      },
    }, 'Profile picture updated successfully');
  } catch (err: any) {
    return apiError(err.message || 'Failed to upload profile picture.', 500);
  }
}

// DELETE: Remove photo and return to default avatar
export async function DELETE(req: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedUser(req);
    if (!authenticatedUser) return apiError('Unauthorized', 401);
    if (authenticatedUser.role !== 'STUDENT') return apiError('Forbidden', 403);
    if (authenticatedUser.accountStatus === 'BLOCKED') return apiError('Forbidden', 403);

    const studentId = authenticatedUser.id;
    const client = getSupabaseClient();

    // Reset profile picture in Supabase
    await client
      .from('profiles')
      .update({
        avatar_url: null,
        profile_image_path: null,
      })
      .eq('user_id', studentId);

    // Optionally delete from storage
    if (authenticatedUser.profileImagePath) {
      await client.storage
        .from('student-profile-pictures')
        .remove([authenticatedUser.profileImagePath]);
    }

    return apiSuccess({
      profile_image_url: null,
      profile_image_path: null,
      avatarUrl: null,
      user: {
        id: authenticatedUser.id,
        registerNumber: authenticatedUser.registerNumber,
        name: authenticatedUser.name,
        avatarUrl: undefined,
        profileImagePath: undefined,
      },
    }, 'Profile picture removed. Reverted to default avatar.');
  } catch (err: any) {
    return apiError(err.message || 'Failed to remove profile picture.', 500);
  }
}

// GET: Retrieve current profile picture path/url for student
export async function GET(req: NextRequest) {
  try {
    const authenticatedUser = await resolveAuthenticatedUser(req);
    if (!authenticatedUser) return apiError('Unauthorized', 401);

    return apiSuccess({
      avatarUrl: authenticatedUser.avatarUrl || null,
      profile_image_path: authenticatedUser.profileImagePath || null,
    });
  } catch (err: any) {
    return apiError(err.message || 'Internal error', 500);
  }
}
