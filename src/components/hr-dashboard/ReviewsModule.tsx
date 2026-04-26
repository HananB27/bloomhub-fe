"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Badge } from "./ui/badge";
import { Calendar } from "./ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import {
  Calendar as CalendarIcon,
  Plus,
  Edit,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  Loader2,
  FileText,
  MessageSquare,
  CheckCircle,
  Clock,
  Star,
} from "lucide-react";
import { formatDate } from "@/utils";
import type {
  PerformanceReview,
  PerformanceReviewListItem,
  PerformanceReviewNote,
  PerformanceReviewActionPoint,
  PerformanceReviewAttachment,
  ReviewStatus,
  ReviewType,
  NoteVisibility,
} from "@/types/reviews";
import {
  REVIEW_STATUS_LABELS,
  REVIEW_STATUS_COLORS,
  REVIEW_TYPE_LABELS,
  ACTION_POINT_STATUS_LABELS,
  ALL_REVIEW_TYPES,
  RATING_SCALE,
  RATING_LABELS,
  NOTE_VISIBILITY_LABELS,
} from "@/types/reviews";
import {
  fetchPerformanceReviews,
  createPerformanceReview,
  updatePerformanceReview,
  updateReviewStatus,
  fetchReviewNotes,
  createReviewNote,
  deleteReviewNote,
  fetchActionPoints,
  createActionPoint,
  deleteActionPoint,
  fetchAttachments,
  uploadAttachment,
  deleteAttachment,
  fetchUserProfiles,
  type UserProfile,
} from "@/lib/api/reviews";

interface ExtendedSession {
  accessToken?: string;
  user?: {
    id?: number;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    is_staff?: boolean;
    is_superuser?: boolean;
  };
}

export function ReviewsModule() {
  const { data: session } = useSession() as {
    data: ExtendedSession | null;
  };

  const [activeTab, setActiveTab] = useState("scheduled");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [reviews, setReviews] = useState<PerformanceReviewListItem[]>([]);
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [notes, setNotes] = useState<PerformanceReviewNote[]>([]);
  const [actionPoints, setActionPoints] = useState<PerformanceReviewActionPoint[]>([]);
  const [attachments, setAttachments] = useState<PerformanceReviewAttachment[]>([]);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [newNoteVisibility, setNewNoteVisibility] = useState<NoteVisibility>("shared");
  const [newActionTitle, setNewActionTitle] = useState("");
  const [newActionDescription, setNewActionDescription] = useState("");
  const [newActionOwner, setNewActionOwner] = useState("");
  const [newActionDueDate, setNewActionDueDate] = useState("");
  const [newReviewEmployeeId, setNewReviewEmployeeId] = useState("");
  const [newReviewReviewerId, setNewReviewReviewerId] = useState("");
  const [newReviewType, setNewReviewType] = useState<ReviewType>("quarterly");
  const [newReviewScheduledDate, setNewReviewScheduledDate] = useState("");
  const [overallRating, setOverallRating] = useState<number | null>(null);
  const [notes_field, setNotesField] = useState("");
  const [cpfScore, setCpfScore] = useState<number | null>(null);
  const [performanceScore, setPerformanceScore] = useState<number | null>(null);

  // Load reviews and user profiles on mount
  useEffect(() => {
    const accessToken = session?.accessToken;
    if (!accessToken) return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [reviewsData, usersData] = await Promise.all([
          fetchPerformanceReviews(accessToken),
          fetchUserProfiles(accessToken),
        ]);
        setReviews(reviewsData);
        setEmployees(usersData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session?.accessToken]);

  // Load review details when selected
  useEffect(() => {
    const accessToken = session?.accessToken;
    if (!selectedReview || !accessToken) return;

    const loadReviewDetails = async () => {
      try {
        const [notesData, actionPointsData, attachmentsData] = await Promise.all([
          fetchReviewNotes(selectedReview.id, accessToken),
          fetchActionPoints(selectedReview.id, accessToken),
          fetchAttachments(selectedReview.id, accessToken),
        ]);
        setNotes(notesData);
        setActionPoints(actionPointsData);
        setAttachments(attachmentsData);
        setOverallRating(selectedReview.overallRating || null);
        setNotesField(selectedReview.summary || "");
        setCpfScore(selectedReview.cpfScore || null);
        setPerformanceScore(selectedReview.performanceScore || null);
      } catch (err) {
        console.error("Failed to load review details:", err);
      }
    };

    loadReviewDetails();
  }, [selectedReview, session?.accessToken]);

  const handleCreateReview = useCallback(async () => {
    const accessToken = session?.accessToken;
    if (!accessToken || !newReviewEmployeeId || !newReviewReviewerId) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setError(null);
      await createPerformanceReview(
        {
          employee: newReviewEmployeeId,
          reviewer: newReviewReviewerId,
          reviewType: newReviewType,
          scheduledDate: newReviewScheduledDate || new Date().toISOString().split('T')[0],
        },
        accessToken
      );
      const data = await fetchPerformanceReviews(accessToken);
      setReviews(data);
      // Reset form and close dialog
      setNewReviewEmployeeId("");
      setNewReviewReviewerId("");
      setNewReviewType("quarterly");
      setNewReviewScheduledDate("");
      setError(null);
      setCreateDialogOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create review";
      setError(message);
    }
  }, [
    session?.accessToken,
    newReviewEmployeeId,
    newReviewReviewerId,
    newReviewType,
    newReviewScheduledDate,
  ]);

  const handleAddNote = useCallback(async () => {
    const accessToken = session?.accessToken;
    if (!selectedReview || !accessToken || !newNoteContent.trim()) {
      return;
    }

    try {
      await createReviewNote(
        selectedReview.id,
        { content: newNoteContent, visibility: newNoteVisibility },
        accessToken
      );
      const notesData = await fetchReviewNotes(selectedReview.id, accessToken);
      setNotes(notesData);
      setNewNoteContent("");
      setNewNoteVisibility("shared");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add note";
      setError(message);
    }
  }, [selectedReview, session?.accessToken, newNoteContent, newNoteVisibility]);

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      const accessToken = session?.accessToken;
      if (!selectedReview || !accessToken) return;

      try {
        await deleteReviewNote(selectedReview.id, noteId, accessToken);
        const notesData = await fetchReviewNotes(selectedReview.id, accessToken);
        setNotes(notesData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete note";
        setError(message);
      }
    },
    [selectedReview, session?.accessToken]
  );

  const handleAddActionPoint = useCallback(async () => {
    const accessToken = session?.accessToken;
    if (!selectedReview || !accessToken || !newActionTitle.trim()) {
      return;
    }

    try {
      const userId = String(session.user?.id || "");
      await createActionPoint(
        selectedReview.id,
        {
          title: newActionTitle,
          description: newActionDescription,
          ownerId: newActionOwner || userId,
          dueDate: newActionDueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        },
        accessToken
      );
      const actionPointsData = await fetchActionPoints(selectedReview.id, accessToken);
      setActionPoints(actionPointsData);
      setNewActionTitle("");
      setNewActionDescription("");
      setNewActionOwner("");
      setNewActionDueDate("");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to add action point";
      setError(message);
    }
  }, [selectedReview, session?.accessToken, session?.user?.id, newActionTitle, newActionDescription, newActionOwner, newActionDueDate]);

  const handleDeleteActionPoint = useCallback(
    async (actionPointId: string) => {
      const accessToken = session?.accessToken;
      if (!selectedReview || !accessToken) return;

      try {
        await deleteActionPoint(selectedReview.id, actionPointId, accessToken);
        const actionPointsData = await fetchActionPoints(selectedReview.id, accessToken);
        setActionPoints(actionPointsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete action point";
        setError(message);
      }
    },
    [selectedReview, session?.accessToken]
  );

  const handleUploadAttachment = useCallback(
    async (file: File) => {
      const accessToken = session?.accessToken;
      if (!selectedReview || !accessToken) return;

      try {
        await uploadAttachment(selectedReview.id, file, accessToken);
        const attachmentsData = await fetchAttachments(selectedReview.id, accessToken);
        setAttachments(attachmentsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload attachment";
        setError(message);
      }
    },
    [selectedReview, session?.accessToken]
  );

  const handleDeleteAttachment = useCallback(
    async (attachmentId: string) => {
      const accessToken = session?.accessToken;
      if (!selectedReview || !accessToken) return;

      try {
        await deleteAttachment(selectedReview.id, attachmentId, accessToken);
        const attachmentsData = await fetchAttachments(selectedReview.id, accessToken);
        setAttachments(attachmentsData);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to delete attachment";
        setError(message);
      }
    },
    [selectedReview, session?.accessToken]
  );

  const handleUpdateReviewOutcome = useCallback(async () => {
    const accessToken = session?.accessToken;
    if (!selectedReview || !accessToken) return;

    try {
      const updated = await updatePerformanceReview(
        selectedReview.id,
        {
          overallRating: overallRating || undefined,
          summary: notes_field || undefined,
          cpfScore: cpfScore || undefined,
          performanceScore: performanceScore || undefined,
        },
        accessToken
      );
      setSelectedReview(updated);
      const data = await fetchPerformanceReviews(accessToken);
      setReviews(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update review";
      setError(message);
    }
  }, [selectedReview, session?.accessToken, overallRating, notes_field, cpfScore, performanceScore]);

  const handleStatusChange = useCallback(
    async (newStatus: ReviewStatus) => {
      const accessToken = session?.accessToken;
      if (!selectedReview || !accessToken) return;

      try {
        const updated = await updateReviewStatus(
          selectedReview.id,
          newStatus,
          accessToken
        );
        setSelectedReview(updated);
        const data = await fetchPerformanceReviews(accessToken);
        setReviews(data);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        setError(message);
      }
    },
    [selectedReview, session?.accessToken]
  );

  const filteredReviews = reviews.filter((r) => r.status === activeTab);

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Performance Reviews</span>
          <Dialog open={createDialogOpen} onOpenChange={(open) => {
            setCreateDialogOpen(open);
            if (!open) {
              // Clear error when dialog closes
              setError(null);
            }
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                New Review
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Schedule New Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                )}
                <div>
                  <Label>Employee</Label>
                  <Select value={newReviewEmployeeId} onValueChange={setNewReviewEmployeeId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Reviewer</Label>
                  <Select value={newReviewReviewerId} onValueChange={setNewReviewReviewerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reviewer" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Review Type</Label>
                  <Select value={newReviewType} onValueChange={(v) => setNewReviewType(v as ReviewType)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_REVIEW_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {REVIEW_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateReview} className="w-full">
                  Create Review
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {!selectedReview ? (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="space-y-4 mt-4">
                {filteredReviews.length === 0 ? (
                  <p className="text-center py-8 text-gray-500">No reviews in this category</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Employee</TableHead>
                          <TableHead>Reviewer</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Rating</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredReviews.map((review) => (
                          <TableRow key={review.id} className="hover:bg-gray-50">
                            <TableCell>{review.employeeName}</TableCell>
                            <TableCell>{review.reviewerName}</TableCell>
                            <TableCell>{REVIEW_TYPE_LABELS[review.reviewType]}</TableCell>
                            <TableCell>{formatDate(review.scheduledDate)}</TableCell>
                            <TableCell>
                              <Badge className={REVIEW_STATUS_COLORS[review.status]}>
                                {REVIEW_STATUS_LABELS[review.status]}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {review.overallRating != null ? (
                                <div className="flex gap-1">
                                  {[1, 2, 3, 4, 5].map((i) => (
                                    <Star
                                      key={i}
                                      className={`w-4 h-4 ${
                                        i <= (review.overallRating ?? 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                                      }`}
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSelectedReview(review)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                ← Back to List
              </Button>
              <Select value={selectedReview.status} onValueChange={(v) => handleStatusChange(v as ReviewStatus)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{selectedReview.employeeName}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-600">Reviewer:</span> {selectedReview.reviewerName}
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span> {REVIEW_TYPE_LABELS[selectedReview.reviewType]}
                  </div>
                  <div>
                    <span className="text-gray-600">Scheduled:</span> {formatDate(selectedReview.scheduledDate)}
                  </div>
                  {selectedReview.nextReviewDate && (
                    <div>
                      <span className="text-gray-600">Next Review:</span> {formatDate(selectedReview.nextReviewDate)}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Overall Rating</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2">
                    {RATING_SCALE.map((rating) => (
                      <button
                        key={rating}
                        onClick={() => setOverallRating(rating)}
                        className={`p-2 rounded transition ${
                          overallRating === rating
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-100 hover:bg-gray-200"
                        }`}
                      >
                        <Star className="w-5 h-5" fill="currentColor" />
                      </button>
                    ))}
                  </div>
                  {overallRating && <p className="text-sm text-gray-600">{RATING_LABELS[overallRating]}</p>}
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="notes" className="w-full">
              <TabsList>
                <TabsTrigger value="notes" className="gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Notes
                </TabsTrigger>
                <TabsTrigger value="actions" className="gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Action Points
                </TabsTrigger>
                <TabsTrigger value="documents" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Documents
                </TabsTrigger>
                <TabsTrigger value="scores" className="gap-2">
                  <Star className="w-4 h-4" />
                  Scores
                </TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label>Add Note</Label>
                    <Textarea
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                      placeholder="Add a note..."
                      className="mt-2 h-20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Select value={newNoteVisibility} onValueChange={(v) => setNewNoteVisibility(v as NoteVisibility)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private</SelectItem>
                        <SelectItem value="shared">Shared</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handleAddNote} className="flex-1">
                      Add Note
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 mt-6">
                  {notes.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No notes yet</p>
                  ) : (
                    notes.map((note) => (
                      <Card key={note.id} className="p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium text-sm">{note.authorName}</p>
                            <Badge variant="outline" className="text-xs mt-1">
                              {NOTE_VISIBILITY_LABELS[note.visibility]}
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <p className="text-sm text-gray-700">{note.content}</p>
                        <p className="text-xs text-gray-500 mt-2">{formatDate(note.updatedAt)}</p>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4 mt-4">
                <div className="space-y-3">
                  <div>
                    <Label>Title</Label>
                    <Input
                      value={newActionTitle}
                      onChange={(e) => setNewActionTitle(e.target.value)}
                      placeholder="Action point title"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={newActionDescription}
                      onChange={(e) => setNewActionDescription(e.target.value)}
                      placeholder="Description"
                      className="mt-2 h-20"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Owner</Label>
                      <Select value={newActionOwner} onValueChange={setNewActionOwner}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map((emp) => (
                            <SelectItem key={emp.id} value={emp.id.toString()}>
                              {emp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newActionDueDate}
                        onChange={(e) => setNewActionDueDate(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <Button onClick={handleAddActionPoint} className="w-full">
                    Add Action Point
                  </Button>
                </div>

                <div className="space-y-2 mt-6">
                  {actionPoints.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No action points</p>
                  ) : (
                    actionPoints.map((ap) => (
                      <Card key={ap.id} className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="font-medium">{ap.title}</p>
                              <Badge variant="outline" className="text-xs">
                                {ACTION_POINT_STATUS_LABELS[ap.status]}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{ap.description}</p>
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>Owner: {ap.ownerName}</span>
                              <span>Due: {formatDate(ap.dueDate)}</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteActionPoint(ap.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4 mt-4">
                <div>
                  <Label>Upload Document</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleUploadAttachment(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                      id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer">
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    </label>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  {attachments.length === 0 ? (
                    <p className="text-center text-gray-500 py-4">No documents</p>
                  ) : (
                    attachments.map((att) => (
                      <Card key={att.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium text-sm">{att.fileName}</p>
                            <p className="text-xs text-gray-500">{att.uploadedByName}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => window.open(att.fileUrl)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteAttachment(att.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="scores" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>CPF Score</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={cpfScore || ""}
                      onChange={(e) => setCpfScore(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="0-100"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Performance Score</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={performanceScore || ""}
                      onChange={(e) => setPerformanceScore(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="0-100"
                      className="mt-2"
                    />
                  </div>
                </div>
                <div>
                  <Label>Notes</Label>
                  <Textarea
                    value={notes_field}
                    onChange={(e) => setNotesField(e.target.value)}
                    placeholder="Review notes..."
                    className="mt-2 h-32"
                  />
                </div>
                <Button onClick={handleUpdateReviewOutcome} className="w-full">
                  Save Scores & Notes
                </Button>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
}
