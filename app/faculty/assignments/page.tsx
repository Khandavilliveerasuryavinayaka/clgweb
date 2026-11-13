'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea, Select } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { Assignment, AssignmentSubmission, Course } from '@/types';
import { formatDate } from '@/lib/utils';
import { 
  FileText, 
  Plus, 
  CheckSquare, 
  Users, 
  Calendar, 
  Download, 
  Award,
  Clock
} from 'lucide-react';

export default function FacultyAssignmentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const searchParams = useSearchParams();
  const queryCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [filterCourseId, setFilterCourseId] = useState<string>('ALL');

  useEffect(() => {
    async function loadFacultyCourses() {
      try {
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const facultyParam = myFacultyId || myFacultyReg || '';

        const res = await fetch(`/api/courses?facultyId=${encodeURIComponent(facultyParam)}&createdByOnly=true`, { cache: 'no-store' });
        const json = await res.json();

        let apiCourses: Course[] = [];
        if (json.success && Array.isArray(json.data)) {
          apiCourses = json.data;
        }

        const mockList = mockDb.getCourses().filter((m) => {
          if (m.isCatalog) return false;
          return (
            (myFacultyId && (m.createdBy === myFacultyId || m.facultyId === myFacultyId)) ||
            (myFacultyReg && (m.createdBy === myFacultyReg || m.facultyId === myFacultyReg))
          );
        });

        const codeSet = new Set(apiCourses.map((c) => c.code?.toUpperCase()));
        const combined = [
          ...apiCourses,
          ...mockList.filter((m) => !codeSet.has(m.code?.toUpperCase())),
        ].filter((c) => !mockDb.isCourseResultsPublished(c.id || c.code));

        setCourses(combined);

        if (queryCourseId) {
          const match = combined.find(
            (c) => c.id === queryCourseId || c.code.toUpperCase() === queryCourseId.toUpperCase()
          );
          if (match) {
            setSelectedCourseId(match.id);
            setFilterCourseId(match.id);
          } else if (combined.length > 0) {
            setSelectedCourseId(combined[0].id);
          }
        } else if (combined.length > 0) {
          setSelectedCourseId(combined[0].id);
        }
      } catch (e) {
        console.error('Failed to load courses on assignments page:', e);
        const myFacultyId = user?.id;
        const myFacultyReg = user?.registerNumber;
        const fallback = mockDb.getCourses().filter(
          (c) =>
            !c.isCatalog &&
            ((myFacultyId && (c.createdBy === myFacultyId || c.facultyId === myFacultyId)) ||
              (myFacultyReg && (c.createdBy === myFacultyReg || c.facultyId === myFacultyReg))) &&
            !mockDb.isCourseResultsPublished(c.id || c.code)
        );
        setCourses(fallback);
        if (fallback.length > 0) setSelectedCourseId(fallback[0].id);
      }
    }
    loadFacultyCourses();
  }, [user, queryCourseId]);

  const assignedCourseIds = new Set(courses.map((c) => c.id));
  const assignedCourseCodes = new Set(courses.map((c) => c.code?.toUpperCase()));
  const allAssignments = mockDb.getAssignments().filter(
    (a) => assignedCourseIds.has(a.courseId) || assignedCourseCodes.has(a.courseCode?.toUpperCase())
  );
  const assignments = filterCourseId === 'ALL'
    ? allAssignments
    : allAssignments.filter((a) => a.courseId === filterCourseId || a.courseCode === filterCourseId);

  const allSubmissions = mockDb.getSubmissions();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [maxMarks, setMaxMarks] = useState(20);
  const [isCreating, setIsCreating] = useState(false);

  // Grading Modal State
  const [gradingSubmission, setGradingSubmission] = useState<AssignmentSubmission | null>(null);
  const [marksGiven, setMarksGiven] = useState(18);
  const [feedback, setFeedback] = useState('Well structured implementation with clear documentation.');
  const [isGrading, setIsGrading] = useState(false);

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toastError('Please complete all mandatory assignment fields.');
      return;
    }

    setIsCreating(true);
    const chosenCourse = courses.find((c) => c.id === selectedCourseId);

    try {
      mockDb.createAssignment({
        courseId: selectedCourseId,
        courseCode: chosenCourse?.code || 'CS601',
        courseName: chosenCourse?.name || 'Course',
        facultyId: user?.id || 'usr-fac-1',
        facultyName: user?.name || 'Prof. Anand Kumar',
        title,
        description,
        dueDate,
        maxMarks,
        attachments: ['guidelines_and_specifications.pdf'],
      });

      setIsCreating(false);
      setCreateModalOpen(false);
      setTitle('');
      setDescription('');
      setDueDate('');
      success('New course assignment published to student portal.', 'Assignment Created');
    } catch (err: any) {
      setIsCreating(false);
      toastError(err.message || 'Failed to create assignment.');
    }
  };

  const handleGradeSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!gradingSubmission) return;

    setIsGrading(true);
    try {
      mockDb.gradeSubmission(gradingSubmission.id, marksGiven, feedback);
      setIsGrading(false);
      setGradingSubmission(null);
      success(
        `Graded submission for ${gradingSubmission.studentName}. Score: ${marksGiven} marks.`,
        'Evaluation Saved'
      );
    } catch (err: any) {
      setIsGrading(false);
      toastError(err.message || 'Failed to grade submission.');
    }
  };

  return (
    <PortalLayout role="FACULTY">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
              Assignments & Coursework Manager
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Create programming tasks, manage deadlines, review submitted archives, and assign feedback scores.
            </p>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Assignment
          </Button>
        </div>

        {/* Course Filter Bar */}
        {courses.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-700">Filter Module:</span>
            <select
              value={filterCourseId}
              onChange={(e) => setFilterCourseId(e.target.value)}
              className="text-xs rounded-xl border border-slate-300 p-2 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="ALL">All My Teaching Modules ({courses.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Existing Assignments */}
        {assignments.length === 0 ? (
          <Card className="border-slate-200 p-12 text-center shadow-card bg-white">
            <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="font-bold text-slate-800 text-base">No Assignments Created Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
              No course assignments have been published for your teaching modules yet. Click &apos;Create New Assignment&apos; above to publish coursework for your students.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {assignments.map((asg) => (
              <Card key={asg.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                          {asg.courseCode}
                        </span>
                        <span className="text-xs text-slate-400">Due: {formatDate(asg.dueDate)}</span>
                      </div>
                      <h3 className="font-bold text-base text-navy-900 leading-snug">{asg.title}</h3>
                    </div>

                    <Badge status="Active">Active Task</Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>

                  <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                    <div>
                      <span className="text-slate-500">Submissions Received:</span>
                      <div className="font-bold text-brand-700 text-sm">{asg.totalSubmissions} Submitted</div>
                    </div>
                    <div>
                      <span className="text-slate-500">Graded So Far:</span>
                      <div className="font-bold text-emerald-600 text-sm">{asg.gradedSubmissions} Graded</div>
                    </div>
                  </div>
                </CardContent>

                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Max Score: {asg.maxMarks} Marks</span>
                  <span className="text-brand-600 font-semibold">Submissions Queue Active</span>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Submissions Grading Ledger */}
        <Card className="border-slate-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold">Student Submissions Awaiting Evaluation</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 border-y border-slate-200 uppercase font-semibold text-slate-500 tracking-wider">
                  <tr>
                    <th className="p-4">Student</th>
                    <th className="p-4">Assignment</th>
                    <th className="p-4">Submitted File</th>
                    <th className="p-4">Submission Date</th>
                    <th className="p-4">Grading Status</th>
                    <th className="p-4 text-center">Score</th>
                    <th className="p-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allSubmissions.map((sub) => (
                    <tr key={sub.id} className="hover:bg-slate-50/60">
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{sub.studentName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{sub.registerNumber}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-900 max-w-xs truncate">
                        Implementation of Raft Consensus State Machine
                      </td>
                      <td className="p-4 font-mono text-brand-600 flex items-center gap-1.5 mt-3">
                        <FileText className="w-3.5 h-3.5" />
                        <span>{sub.fileName}</span>
                      </td>
                      <td className="p-4 text-slate-500">{formatDate(sub.submittedAt)}</td>
                      <td className="p-4">
                        <Badge status={sub.status === 'Graded' ? 'Approved' : 'Pending'}>
                          {sub.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-center font-bold text-sm text-slate-900">
                        {sub.marksObtained !== undefined ? `${sub.marksObtained} / 20` : '—'}
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-xs px-2.5"
                          onClick={() => {
                            setGradingSubmission(sub);
                            setMarksGiven(sub.marksObtained || 18);
                            setFeedback(sub.facultyFeedback || 'Good work on distributed state machine logic.');
                          }}
                        >
                          {sub.status === 'Graded' ? 'Re-grade' : 'Grade'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Create Assignment Modal */}
        <Modal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Course Assignment"
          maxWidth="md"
        >
          <form onSubmit={handleCreateAssignment} className="space-y-4">
            <Select
              label="Course Module"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              options={courses.map((c) => ({
                label: `${c.code} - ${c.name}`,
                value: c.id,
              }))}
            />

            <Input
              label="Assignment Title"
              required
              placeholder="e.g. Distributed Consensus Engine using Raft"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />

            <Textarea
              label="Task Specifications & Criteria"
              required
              rows={4}
              placeholder="Detailed instructions for students, submission constraints..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Submission Due Date"
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
              <Input
                label="Maximum Marks"
                type="number"
                required
                min={5}
                max={50}
                value={maxMarks}
                onChange={(e) => setMaxMarks(parseInt(e.target.value, 10) || 20)}
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isCreating}>
                Publish Assignment
              </Button>
            </div>
          </form>
        </Modal>

        {/* Grade Submission Modal */}
        {gradingSubmission && (
          <Modal
            isOpen={!!gradingSubmission}
            onClose={() => setGradingSubmission(null)}
            title={`Evaluate Submission: ${gradingSubmission.studentName}`}
            maxWidth="md"
          >
            <form onSubmit={handleGradeSubmission} className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div>Candidate: <strong>{gradingSubmission.studentName} ({gradingSubmission.registerNumber})</strong></div>
                <div>Submitted File: <strong className="font-mono">{gradingSubmission.fileName}</strong></div>
              </div>

              <Input
                label="Awarded Score (Max 20 Marks)"
                type="number"
                required
                min={0}
                max={20}
                value={marksGiven}
                onChange={(e) => setMarksGiven(parseInt(e.target.value, 10) || 0)}
              />

              <Textarea
                label="Faculty Qualitative Feedback"
                rows={3}
                required
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setGradingSubmission(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isGrading}>
                  Save Evaluation
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
