import { getSupabaseClient } from '@/lib/supabase';
import { 
  User, 
  Course, 
  CourseRegistration, 
  SemesterResult, 
  FeeAssignment, 
  PaymentTransaction,
  Receipt,
  AttendanceRecord,
  InternalMark
} from '@/types';

class SupabaseService {
  private _client: any = null;

  private get client() {
    if (!this._client) {
      this._client = getSupabaseClient();
    }
    return this._client;
  }

  // ==========================================
  // 1. AUTHENTICATION & USERS
  // ==========================================
  async getUserByRegisterNumber(registerNumber: string): Promise<User | null> {
    const term = registerNumber.trim();
    // Resolve known aliases
    let searchReg = term;
    if (term.toLowerCase() === 'admin') searchReg = 'ADMIN001';
    else if (term.toUpperCase() === 'FAC101') searchReg = 'FAC001';

    try {
      const { data, error } = await this.client
        .from('users')
        .select(`
          id,
          register_number,
          email,
          role,
          account_status,
          created_at,
          profiles (
            full_name,
            phone,
            avatar_url,
            profile_image_path
          ),
          students (
            id,
            current_semester,
            batch,
            programs ( name ),
            departments ( name )
          )
        `)
        .or(`register_number.ilike.${searchReg},email.ilike.${term}`)
        .maybeSingle();

      if (data && !error) {
        const studentInfo = Array.isArray(data.students) ? data.students[0] : data.students;
        const profileInfo = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

        return {
          id: data.id,
          appId: studentInfo?.id || 1,
          studentNumber: studentInfo?.id || 1,
          registerNumber: data.register_number,
          email: data.email,
          name: profileInfo?.full_name || data.register_number,
          role: data.role,
          accountStatus: data.account_status || 'ACTIVE',
          phone: profileInfo?.phone,
          avatarUrl: profileInfo?.avatar_url,
          profileImagePath: profileInfo?.profile_image_path,
          department: (Array.isArray(studentInfo?.departments) ? (studentInfo?.departments[0] as any)?.name : (studentInfo?.departments as any)?.name) || 'Computer Science and Engineering',
          program: (Array.isArray(studentInfo?.programs) ? (studentInfo?.programs[0] as any)?.name : (studentInfo?.programs as any)?.name) || 'B.Tech Computer Science',
          semester: studentInfo?.current_semester || 6,
          batch: studentInfo?.batch || '2023-2027',
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.error('Error fetching user by register number:', e);
    }
    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from('users')
        .select(`
          id,
          register_number,
          email,
          role,
          account_status,
          created_at,
          profiles (
            full_name,
            phone,
            avatar_url,
            profile_image_path
          ),
          students (
            id,
            current_semester,
            batch,
            programs ( name ),
            departments ( name )
          )
        `)
        .eq('id', id)
        .maybeSingle();

      if (data && !error) {
        const studentInfo = Array.isArray(data.students) ? data.students[0] : data.students;
        const profileInfo = Array.isArray(data.profiles) ? data.profiles[0] : data.profiles;

        return {
          id: data.id,
          appId: studentInfo?.id || 1,
          studentNumber: studentInfo?.id || 1,
          registerNumber: data.register_number,
          email: data.email,
          name: profileInfo?.full_name || data.register_number,
          role: data.role,
          accountStatus: data.account_status || 'ACTIVE',
          phone: profileInfo?.phone,
          avatarUrl: profileInfo?.avatar_url,
          profileImagePath: profileInfo?.profile_image_path,
          department: (Array.isArray(studentInfo?.departments) ? (studentInfo?.departments[0] as any)?.name : (studentInfo?.departments as any)?.name) || 'Computer Science and Engineering',
          program: (Array.isArray(studentInfo?.programs) ? (studentInfo?.programs[0] as any)?.name : (studentInfo?.programs as any)?.name) || 'B.Tech Computer Science',
          semester: studentInfo?.current_semester || 6,
          batch: studentInfo?.batch || '2023-2027',
          createdAt: data.created_at,
        };
      }
    } catch (e) {
      console.error('Error fetching user by id:', e);
    }
    return null;
  }

  // ==========================================
  // 2. COURSES
  // ==========================================
  async getCourses(filters?: { facultyId?: string; departmentId?: string; semester?: number; onlyCreatedByFaculty?: boolean }): Promise<Course[]> {
    try {
      let query = this.client
        .from('courses')
        .select(`
          id,
          code,
          name,
          department_id,
          credits,
          type,
          description,
          created_by,
          is_catalog,
          departments ( name ),
          course_offerings (
            id,
            faculty_id,
            max_capacity,
            enrolled_count,
            section
          )
        `)
        .order('id', { ascending: true });

      if (filters?.departmentId) query = query.eq('department_id', filters.departmentId);

      const { data, error } = await query;
      if (data && !error) {
        // Fetch profiles map to resolve faculty names
        const { data: profiles } = await this.client
          .from('profiles')
          .select('user_id, full_name');
        const nameMap = new Map<string, string>();
        (profiles || []).forEach((p: any) => {
          if (p.user_id && p.full_name) nameMap.set(p.user_id, p.full_name);
        });

        // Resolve target faculty identifier if filtering is requested
        let targetFacultyUuid: string | undefined = undefined;
        let targetRegNumber: string | undefined = undefined;

        if (filters?.facultyId) {
          const fid = filters.facultyId.trim();
          if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(fid)) {
            targetFacultyUuid = fid;
            const { data: u } = await this.client.from('users').select('register_number').eq('id', fid).maybeSingle();
            targetRegNumber = u?.register_number;
          } else {
            targetRegNumber = fid;
            const { data: u } = await this.client.from('users').select('id').eq('register_number', fid).maybeSingle();
            targetFacultyUuid = u?.id;
          }
        }

        let mapped: Course[] = data.map((c: any) => {
          const dept = Array.isArray(c.departments) ? c.departments[0] : c.departments;
          const offering = Array.isArray(c.course_offerings) ? c.course_offerings[0] : c.course_offerings;
          const facId = c.created_by || offering?.faculty_id;
          const facName = facId ? (nameMap.get(facId) || 'Course Instructor') : 'Department Faculty';

          return {
            id: String(c.id),
            appId: Number(c.id),
            courseNumber: Number(c.id),
            code: c.code,
            name: c.name,
            departmentId: String(c.department_id),
            departmentName: dept?.name || 'Computer Science and Engineering',
            semester: c.semester || 6,
            credits: c.credits || 4,
            type: (c.course_type || c.type || 'CORE') as 'CORE' | 'ELECTIVE' | 'LAB',
            description: c.description || '',
            facultyId: facId,
            facultyName: facName,
            maxStudents: offering?.max_capacity || 60,
            enrolledStudents: offering?.enrolled_count || 0,
            isRegistrationOpen: true,
            createdBy: c.created_by || undefined,
            isCatalog: !!c.is_catalog,
          };
        });

        // Strictly filter: if faculty querying, ONLY show courses CREATED by this faculty
        // Never show catalog or pre-seeded courses to faculty unless created by them.
        if (filters?.onlyCreatedByFaculty || filters?.facultyId) {
          mapped = mapped.filter((c: Course) => {
            if (c.isCatalog) return false;
            if (targetFacultyUuid && (c.createdBy === targetFacultyUuid || c.facultyId === targetFacultyUuid)) {
              return true;
            }
            if (targetRegNumber && (c.createdBy === targetRegNumber || c.facultyId === targetRegNumber)) {
              return true;
            }
            return false;
          });
        }

        return mapped;
      }
    } catch (e) {
      console.error('Error fetching courses:', e);
    }
    return [];
  }

  async createCourse(courseData: {
    code: string;
    name: string;
    departmentName?: string;
    departmentId?: string;
    semester: number;
    credits: number;
    type?: 'CORE' | 'ELECTIVE' | 'LAB';
    description: string;
    facultyId?: string;
    facultyName?: string;
    maxStudents?: number;
    academicYear?: string;
  }): Promise<Course> {
    const deptId = courseData.departmentId ? Number(courseData.departmentId) : 1;

    // Resolve valid faculty user UUID
    let validFacultyId = courseData.facultyId;
    if (validFacultyId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(validFacultyId)) {
      const { data: facCheck } = await this.client
        .from('faculty')
        .select('user_id')
        .eq('user_id', validFacultyId)
        .maybeSingle();
      if (!facCheck) {
        validFacultyId = 'f0000000-0000-0000-0000-000000000001';
      }
    } else if (validFacultyId) {
      const { data: uCheck } = await this.client
        .from('users')
        .select('id')
        .eq('register_number', validFacultyId)
        .maybeSingle();
      if (uCheck?.id) {
        validFacultyId = uCheck.id;
      } else {
        validFacultyId = 'f0000000-0000-0000-0000-000000000001';
      }
    } else {
      validFacultyId = 'f0000000-0000-0000-0000-000000000001';
    }

    const { data: newCourse, error } = await this.client
      .from('courses')
      .insert({
        code: courseData.code.trim().toUpperCase(),
        name: courseData.name.trim(),
        department_id: isNaN(deptId) ? 1 : deptId,
        credits: courseData.credits,
        type: courseData.type || 'THEORY',
        description: courseData.description,
        created_by: validFacultyId,
        is_catalog: false,
      })
      .select()
      .single();

    if (error || !newCourse) {
      throw new Error(`Failed to create course: ${error?.message}`);
    }

    // Create course offering row
    await this.client.from('course_offerings').insert({
      course_id: newCourse.id,
      academic_year_id: 1,
      semester_id: 1,
      section: 'A',
      faculty_id: validFacultyId,
      max_capacity: courseData.maxStudents || 60,
      enrolled_count: 0,
    });

    return {
      id: String(newCourse.id),
      appId: Number(newCourse.id),
      courseNumber: Number(newCourse.id),
      code: newCourse.code,
      name: newCourse.name,
      departmentId: String(newCourse.department_id),
      departmentName: courseData.departmentName || 'Computer Science and Engineering',
      semester: courseData.semester,
      credits: newCourse.credits,
      type: newCourse.type as any,
      description: newCourse.description,
      facultyId: validFacultyId,
      facultyName: courseData.facultyName || 'Course Instructor',
      maxStudents: courseData.maxStudents || 60,
      enrolledStudents: 0,
      isRegistrationOpen: true,
      createdBy: validFacultyId,
      isCatalog: false,
    };
  }

  async deleteCourse(courseIdOrCode: string | number): Promise<boolean> {
    try {
      const clean = String(courseIdOrCode).trim();
      let targetId: number | null = !isNaN(Number(clean)) ? Number(clean) : null;

      if (targetId === null) {
        const { data: found } = await this.client
          .from('courses')
          .select('id')
          .ilike('code', clean)
          .maybeSingle();
        if (found?.id) {
          targetId = Number(found.id);
        }
      }

      if (!targetId) return false;

      // 1. Find offering IDs
      const { data: offerings } = await this.client
        .from('course_offerings')
        .select('id')
        .eq('course_id', targetId);

      const offeringIds = (offerings || []).map((o: any) => o.id);

      // 2. Delete enrollments for those offerings
      if (offeringIds.length > 0) {
        await this.client.from('course_enrollments').delete().in('offering_id', offeringIds);
      }

      // 3. Delete course results
      await this.client.from('semester_results').delete().eq('course_id', targetId);

      // 4. Delete offerings
      await this.client.from('course_offerings').delete().eq('course_id', targetId);

      // 5. Delete course
      const { error } = await this.client.from('courses').delete().eq('id', targetId);
      if (error) {
        console.error('Error deleting course from Supabase:', error);
        return false;
      }
      return true;
    } catch (e) {
      console.error('deleteCourse error:', e);
      return false;
    }
  }

  // ==========================================
  // 3. COURSE ENROLLMENTS
  // ==========================================
  async requestEnrollment(studentUserId: string, courseId: string): Promise<CourseRegistration> {
    // Resolve student numeric ID
    const { data: stu } = await this.client
      .from('students')
      .select('id, user_id, current_semester, batch, users(register_number), profiles(full_name)')
      .eq('user_id', studentUserId)
      .maybeSingle();

    const studentPk = stu ? stu.id : 1;
    const coursePk = Number(courseId);

    const { data: reg, error } = await this.client
      .from('course_enrollments')
      .insert({
        student_id: studentPk,
        course_id: isNaN(coursePk) ? 1 : coursePk,
        semester: stu?.current_semester || 6,
        academic_year: '2024-2025',
        status: 'PENDING',
      })
      .select('*, courses(code, name, credits)')
      .single();

    if (error) {
      throw new Error(`Enrollment request failed: ${error.message}`);
    }

    return {
      id: String(reg.id),
      appId: Number(reg.id),
      studentId: studentUserId,
      registerNumber: (stu as any)?.users?.register_number || 'REG2024001',
      studentName: (stu as any)?.profiles?.full_name || 'Student',
      courseId: String(reg.course_id),
      courseCode: reg.courses?.code || 'CS601',
      courseName: reg.courses?.name || 'Course',
      credits: reg.courses?.credits || 4,
      semester: reg.semester,
      academicYear: reg.academic_year,
      status: reg.status,
      requestedAt: reg.requested_at,
    };
  }

  async updateEnrollmentStatus(
    regId: string, 
    action: 'ACCEPTED' | 'REJECTED', 
    reviewerId?: string, 
    remarks?: string
  ) {
    const { data, error } = await this.client
      .from('course_enrollments')
      .update({
        status: action,
        reviewed_by: reviewerId || null,
        reviewed_at: new Date().toISOString(),
        remarks: remarks || null,
      })
      .eq('id', Number(regId))
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update enrollment: ${error.message}`);
    }
    return data;
  }

  // ==========================================
  // 4. ATTENDANCE (Strictly TODAY enforcement)
  // ==========================================
  async markAttendance(data: {
    courseId: string;
    courseCode?: string;
    courseName?: string;
    facultyId: string;
    facultyName?: string;
    date: string;
    records: { studentId: string; registerNumber: string; studentName: string; status: 'PRESENT' | 'ABSENT' | 'OD'; period?: number }[];
  }) {
    const today = new Date().toISOString().split('T')[0];
    if (data.date !== today) {
      throw new Error(`SECURITY POLICY: Attendance can strictly ONLY be marked for today (${today}). Attempted date: ${data.date}`);
    }

    const coursePk = Number(data.courseId);

    // Get or create session
    const { data: session, error: sessErr } = await this.client
      .from('attendance_sessions')
      .insert({
        course_offering_id: isNaN(coursePk) ? 1 : coursePk,
        session_date: today,
        period_number: data.records[0]?.period || 1,
        created_by: data.facultyId,
      })
      .select()
      .single();

    if (sessErr || !session) {
      throw new Error(`Failed to create attendance session: ${sessErr?.message}`);
    }

    // Insert records
    const rows = data.records.map((r) => ({
      attendance_session_id: session.id,
      student_id: r.studentId,
      status: r.status,
    }));

    const { error: recErr } = await this.client
      .from('attendance_records')
      .insert(rows);

    if (recErr) {
      throw new Error(`Failed to save attendance records: ${recErr.message}`);
    }

    return { success: true, count: rows.length, sessionId: session.id, date: today };
  }

  // ==========================================
  // 5. RESULTS & AUTOMATED GRADING
  // ==========================================
  async getStudentVisibleResults(studentId: string): Promise<SemesterResult[]> {
    try {
      const { data, error } = await this.client
        .from('results')
        .select(`
          id,
          student_id,
          course_id,
          semester_number,
          internal_marks,
          external_marks,
          total_marks,
          grade,
          grade_points,
          pass_status,
          status,
          result_status,
          courses ( code, name, credits )
        `)
        .eq('student_id', studentId)
        .or('status.eq.Published,result_status.eq.Published,status.eq.Approved,result_status.eq.Approved');

      if (data && !error) {
        return data.map((r: any) => ({
          id: String(r.id),
          appId: Number(r.id),
          studentId: r.student_id,
          registerNumber: '',
          studentName: '',
          courseId: String(r.course_id),
          courseCode: r.courses?.code || 'CS601',
          courseName: r.courses?.name || 'Course',
          credits: r.courses?.credits || 4,
          internalMarks: Number(r.internal_marks),
          externalMarks: Number(r.external_marks || 0),
          totalMarks: Number(r.total_marks || 0),
          grade: r.grade || '—',
          gradePoints: Number(r.grade_points || 0),
          passStatus: r.pass_status || 'PENDING',
          semester: r.semester_number || 6,
          academicYear: '2024-2025',
          status: (r.status === 'Approved' || r.result_status === 'Approved') ? 'Approved' : 'Published',
          submittedBy: '',
          submittedAt: '',
        }));
      }
    } catch (e) {
      console.error('Error fetching visible results:', e);
    }
    return [];
  }

  async submitCourseResults(
    courseId: string,
    facultyId: string,
    studentResults: { studentId: string; externalMarks: number }[]
  ) {
    const coursePk = Number(courseId);

    for (const res of studentResults) {
      // Upsert into results table - triggers automatic grade and pass_status computation!
      await this.client
        .from('results')
        .upsert({
          course_id: isNaN(coursePk) ? 1 : coursePk,
          student_id: res.studentId,
          external_marks: res.externalMarks,
          status: 'Submitted',
          result_status: 'Submitted',
          semester_number: 6,
          academic_year_id: 1,
        });
    }

    // Record submission manifest
    await this.client.from('course_result_submissions').insert({
      course_id: isNaN(coursePk) ? 1 : coursePk,
      faculty_id: facultyId,
      academic_year: '2024-2025',
      semester: 6,
      total_students: studentResults.length,
      submitted_students_count: studentResults.length,
      status: 'Submitted',
      submitted_at: new Date().toISOString(),
    });

    return { success: true, count: studentResults.length };
  }

  async approveCourseResults(courseId: string, adminId: string) {
    const coursePk = Number(courseId);
    await this.client
      .from('results')
      .update({ status: 'Approved', result_status: 'Approved' })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    await this.client
      .from('course_result_submissions')
      .update({
        status: 'Approved',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    return { success: true };
  }

  async publishCourseResults(courseId: string, adminId: string) {
    const coursePk = Number(courseId);
    await this.client
      .from('results')
      .update({ status: 'Published', result_status: 'Published' })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    await this.client
      .from('course_result_submissions')
      .update({
        status: 'Published',
        published_by: adminId,
        published_at: new Date().toISOString(),
      })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    return { success: true };
  }

  async rejectCourseResults(courseId: string, adminId: string, remarks?: string) {
    const coursePk = Number(courseId);
    await this.client
      .from('results')
      .update({ status: 'Rejected', result_status: 'Rejected' })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    await this.client
      .from('course_result_submissions')
      .update({
        status: 'Rejected',
        remarks: remarks || 'Returned to faculty for grade rectification.',
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('course_id', isNaN(coursePk) ? 1 : coursePk);

    return { success: true };
  }

  // ==========================================
  // 6. BATCH-BASED FEE ASSIGNMENT & PAYMENTS
  // ==========================================
  async createFeeAssignment(data: {
    feeName: string;
    feeType: string;
    amount: number;
    academicYear: string;
    batch: string;
    dueDate: string;
    description?: string;
  }): Promise<{ assignment: FeeAssignment; assignedStudentsCount: number }> {
    const { data: newFee, error } = await this.client
      .from('fee_assignments')
      .insert({
        fee_name: data.feeName,
        fee_type: data.feeType,
        amount: data.amount,
        academic_year: data.academicYear,
        batch: data.batch,
        due_date: data.dueDate,
        status: 'Active',
      })
      .select()
      .single();

    if (error || !newFee) {
      throw new Error(`Failed to create fee assignment: ${error?.message}`);
    }

    // Count assigned students in the cohort
    const { count } = await this.client
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('batch', data.batch);

    return {
      assignment: {
        id: String(newFee.id),
        appId: Number(newFee.id),
        feeName: newFee.fee_name || data.feeName,
        feeType: newFee.fee_type || data.feeType,
        amount: Number(newFee.amount || data.amount),
        academicYear: newFee.academic_year || data.academicYear,
        batch: newFee.batch || data.batch,
        dueDate: newFee.due_date || data.dueDate,
        description: data.description || '',
        status: 'Active',
        createdBy: 'Admin',
        createdAt: newFee.created_at,
        updatedAt: newFee.created_at,
      },
      assignedStudentsCount: count || 0,
    };
  }

  async processPayment(feeId: string, amount: number, paymentMethod: string, studentId: string): Promise<{ transaction: PaymentTransaction; receipt: Receipt }> {
    const txnId = `TXN-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1000)}`;
    const rcpNo = `RCP-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
    const feePk = Number(feeId);

    // Normalize payment mode for database check constraint ('ONLINE', 'UPI', 'CARD', 'NET_BANKING', 'DD', 'CASH')
    let normalizedMode = 'UPI';
    const pmUpper = (paymentMethod || '').toUpperCase();
    if (pmUpper.includes('CARD')) normalizedMode = 'CARD';
    else if (pmUpper.includes('NET') || pmUpper.includes('BANK')) normalizedMode = 'NET_BANKING';
    else if (pmUpper.includes('CASH')) normalizedMode = 'CASH';
    else if (pmUpper.includes('DD')) normalizedMode = 'DD';
    else if (pmUpper.includes('ONLINE')) normalizedMode = 'ONLINE';

    // 1. Insert Payment into Supabase
    const { data: payment, error: pErr } = await this.client
      .from('payments')
      .insert({
        student_id: studentId,
        student_fee_id: isNaN(feePk) ? 1 : feePk,
        amount,
        payment_mode: normalizedMode,
        transaction_reference: txnId,
        payment_date: new Date().toISOString(),
        payment_status: 'SUCCESS',
      })
      .select()
      .single();

    if (pErr) throw new Error(`Payment processing error: ${pErr.message}`);

    // 2. Insert Receipt
    const { data: receipt, error: rErr } = await this.client
      .from('receipts')
      .insert({
        student_id: studentId,
        payment_id: payment.id,
        receipt_number: rcpNo,
        amount,
        payment_method: normalizedMode,
        fee_title: 'Institutional Academic Fee',
      })
      .select()
      .single();

    // 3. Update student fee status
    await this.client
      .from('student_fees')
      .update({
        paid_amount: amount,
        due_amount: 0,
        status: 'PAID',
      })
      .eq('student_id', studentId)
      .eq('id', isNaN(feePk) ? 1 : feePk);

    return {
      transaction: {
        id: String(payment.id),
        appId: Number(payment.id),
        transactionId: txnId,
        studentId,
        registerNumber: '',
        studentName: '',
        feeId,
        feeTitle: 'Institutional Academic Fee',
        amount,
        paymentMethod,
        status: 'Success',
        timestamp: payment.created_at || new Date().toISOString(),
        receiptNumber: rcpNo,
      },
      receipt: {
        id: String(receipt.id),
        appId: Number(receipt.id),
        receiptNumber: rcpNo,
        transactionId: txnId,
        studentId,
        studentName: 'Student',
        registerNumber: '',
        program: 'B.Tech',
        department: 'Computer Science',
        semester: 6,
        amount,
        paymentMethod,
        date: receipt.generated_at || new Date().toISOString(),
        feeTitle: 'Institutional Academic Fee',
        academicYear: '2024-2025',
      },
    };
  }

  // ==========================================
  // 7. STUDENT BLOCKING
  // ==========================================
  async blockStudent(studentRegisterNumber: string, reason: string, blockerName: string, blockerId: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id, register_number')
      .eq('register_number', studentRegisterNumber)
      .single();

    if (!user) throw new Error(`Student ${studentRegisterNumber} not found.`);

    await this.client
      .from('users')
      .update({ account_status: 'BLOCKED' })
      .eq('id', user.id);

    await this.client.from('student_block_history').insert({
      student_id: user.id,
      reason,
      blocked_by: blockerId,
    });

    return { registerNumber: studentRegisterNumber, status: 'BLOCKED' };
  }

  async unblockStudent(studentRegisterNumber: string, remarks: string, adminId: string) {
    const { data: user } = await this.client
      .from('users')
      .select('id, register_number')
      .eq('register_number', studentRegisterNumber)
      .single();

    if (!user) throw new Error(`Student ${studentRegisterNumber} not found.`);

    await this.client
      .from('users')
      .update({ account_status: 'ACTIVE' })
      .eq('id', user.id);

    await this.client
      .from('student_block_history')
      .update({
        unblocked_by: adminId,
        unblocked_at: new Date().toISOString(),
        unblock_remarks: remarks,
      })
      .eq('student_id', user.id);

    return { registerNumber: studentRegisterNumber, status: 'ACTIVE' };
  }
}

export const supabaseService = new SupabaseService();
