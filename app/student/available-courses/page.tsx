'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function StudentAvailableCoursesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/student/course-registration');
  }, [router]);

  return null;
}
