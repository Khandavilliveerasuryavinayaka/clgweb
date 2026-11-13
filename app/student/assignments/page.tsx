'use client';

import React, { useState } from 'react';
import { PortalLayout } from '@/components/portal/PortalLayout';
import { useAuth } from '@/context/AuthContext';
import { mockDb } from '@/lib/data/mockDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Select';
import { useToast } from '@/components/ui/Toast';
import { formatDate } from '@/lib/utils';
import { Assignment } from '@/types';
import { 
  FileText, 
  Calendar, 
  UploadCloud, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Award,
  AlertCircle
} from 'lucide-react';

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const studentId = user?.id || '';

  const registrations = user ? mockDb.getCourseRegistrations(studentId).filter(r => r.status === 'Approved') : [];
  const enrolledCourseIds = new Set(registrations.map(r => r.courseId));
  const assignments = mockDb.getAssignments().filter(a => enrolledCourseIds.has(a.courseId));
  const submissions = user ? mockDb.getSubmissions(undefined, studentId) : [];

  const [activeAsg, setActiveAsg] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmitAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAsg || !submissionFile.trim()) {
      toastError('Please enter a submission file name.');
      return;
    }

    setIsSubmitting(true);
    try {
      mockDb.submitAssignment({
        assignmentId: activeAsg.id,
        studentId,
        registerNumber: user?.registerNumber || 'REG2024001',
        studentName: user?.name || 'Rahul Verma',
        fileName: submissionFile,
        fileSize: '3.5 MB',
        comments,
      });

      success('Assignment submission uploaded successfully.', 'Submission Recorded');
      setActiveAsg(null);
      setSubmissionFile('');
      setComments('');
    } catch (err: any) {
      toastError(err.message || 'Failed to submit assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout role="STUDENT">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-navy-900 tracking-tight">
            Academic Coursework & Assignments
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Submit required problem sets, engineering code repositories, and laboratory experiment reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assignments.map((asg) => {
            const submission = submissions.find((s) => s.assignmentId === asg.id);
            const isSubmitted = !!submission;

            return (
              <Card key={asg.id} className="border-slate-200 shadow-card hover:shadow-elevated transition-all flex flex-col justify-between">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-200">
                          {asg.courseCode}
                        </span>
                        <span className="text-xs text-slate-500">• {asg.facultyName}</span>
                      </div>
                      <h3 className="font-bold text-base text-navy-900 leading-snug">{asg.title}</h3>
                    </div>

                    <Badge status={isSubmitted ? (submission.marksObtained !== undefined ? 'Approved' : 'Submitted') : 'Pending'}>
                      {isSubmitted ? (submission.marksObtained !== undefined ? 'Graded' : 'Submitted') : 'Pending'}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">{asg.description}</p>

                  <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs text-slate-500">
                    <div className="flex justify-between">
                      <span>Deadline:</span>
                      <span className="font-bold text-rose-600">{formatDate(asg.dueDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum Marks:</span>
                      <span className="font-semibold text-slate-800">{asg.maxMarks} Marks</span>
                    </div>
                  </div>

                  {/* Submission details if already submitted */}
                  {submission && (
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                      <div className="flex items-center justify-between font-semibold text-slate-800">
                        <span className="flex items-center gap-1.5 text-emerald-600">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Submitted on {formatDate(submission.submittedAt)}</span>
                        </span>
                        <span className="font-mono text-slate-500">{submission.fileName}</span>
                      </div>

                      {submission.marksObtained !== undefined && (
                        <div className="pt-2 border-t border-slate-200 space-y-1">
                          <div className="flex justify-between font-bold text-brand-700">
                            <span>Evaluated Score:</span>
                            <span className="text-sm">{submission.marksObtained} / {asg.maxMarks}</span>
                          </div>
                          {submission.facultyFeedback && (
                            <p className="text-[11px] text-slate-600 italic">
                              <strong>Feedback:</strong> {submission.facultyFeedback}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>

                <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end">
                  {!isSubmitted ? (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => setActiveAsg(asg)}
                      leftIcon={<UploadCloud className="w-4 h-4" />}
                    >
                      Upload Submission
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActiveAsg(asg)}
                    >
                      Re-submit File
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {/* Upload Submission Modal */}
        {activeAsg && (
          <Modal
            isOpen={!!activeAsg}
            onClose={() => setActiveAsg(null)}
            title={`Submit: ${activeAsg.title}`}
            maxWidth="md"
          >
            <form onSubmit={handleSubmitAssignment} className="space-y-4">
              <div className="text-xs text-slate-500">
                Course: <strong>{activeAsg.courseCode} - {activeAsg.courseName}</strong><br />
                Due Date: <strong>{formatDate(activeAsg.dueDate)}</strong>
              </div>

              <Input
                label="Submission File Name / Archive"
                required
                placeholder="e.g. distributed_raft_solution_rahul.zip"
                value={submissionFile}
                onChange={(e) => setSubmissionFile(e.target.value)}
                helperText="Upload your source code zip, report PDF, or solution archive."
              />

              <Textarea
                label="Student Notes / Implementation Remarks (Optional)"
                rows={3}
                placeholder="Include benchmark observations or implementation specifics..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveAsg(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting}>
                  Confirm & Submit
                </Button>
              </div>
            </form>
          </Modal>
        )}
      </div>
    </PortalLayout>
  );
}
