import { useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Switch } from "./ui/switch";
import { Separator } from "./ui/separator";
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Checkbox } from "./ui/checkbox";
import {
  Star,
  Calendar,
  User,
  FileText,
  Upload,
  Download,
  Edit3,
  Save,
  Plus,
  Filter,
  Eye,
  EyeOff,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Circle,
  X,
  Paperclip,
  AlertCircle,
} from "lucide-react";

export function ReviewsModule() {
  const [selectedEmployee, setSelectedEmployee] = useState("sarah-johnson");
  const [selectedReview, setSelectedReview] = useState("q3-2025");
  const [isNotesPrivate, setIsNotesPrivate] = useState(false);
  const [reviewNotes, setReviewNotes] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

  // Mock employee data
  const employees = [
    {
      id: "sarah-johnson",
      name: "Sarah Johnson",
      department: "Engineering",
      role: "Senior Developer",
    },
    {
      id: "michael-chen",
      name: "Michael Chen",
      department: "Marketing",
      role: "Marketing Manager",
    },
    {
      id: "emily-rodriguez",
      name: "Emily Rodriguez",
      department: "Sales",
      role: "Sales Representative",
    },
    {
      id: "david-kim",
      name: "David Kim",
      department: "HR",
      role: "HR Specialist",
    },
  ];

  // Mock scheduled reviews
  const scheduledReviews = [
    {
      id: "q3-2025",
      employee: "Sarah Johnson",
      reviewer: "Alex Thompson",
      type: "Quarterly Review",
      scheduledDate: "Aug 15, 2025",
      status: "In Progress",
      progress: 60,
    },
    {
      id: "annual-2025",
      employee: "Sarah Johnson",
      reviewer: "Alex Thompson",
      type: "Annual Review",
      scheduledDate: "Dec 15, 2025",
      status: "Scheduled",
      progress: 0,
    },
    {
      id: "probation-2025",
      employee: "Michael Chen",
      reviewer: "Lisa Wong",
      type: "Probation Review",
      scheduledDate: "Aug 20, 2025",
      status: "Pending",
      progress: 0,
    },
    {
      id: "mid-year-2025",
      employee: "Emily Rodriguez",
      reviewer: "John Smith",
      type: "Mid-Year Review",
      scheduledDate: "Aug 10, 2025",
      status: "Completed",
      progress: 100,
    },
  ];

  // Mock goals and action items
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Complete React certification",
      description:
        "Obtain React developer certification to improve frontend skills",
      category: "Professional Development",
      status: "completed",
      dueDate: "Jul 30, 2025",
      progress: 100,
    },
    {
      id: 2,
      title: "Lead team project delivery",
      description:
        "Successfully deliver the e-commerce platform redesign project on time",
      category: "Leadership",
      status: "in-progress",
      dueDate: "Sep 15, 2025",
      progress: 75,
    },
    {
      id: 3,
      title: "Mentor junior developers",
      description:
        "Provide guidance and mentorship to 2 junior developers in the team",
      category: "Team Development",
      status: "in-progress",
      dueDate: "Dec 31, 2025",
      progress: 45,
    },
    {
      id: 4,
      title: "Improve code review practices",
      description:
        "Establish consistent code review standards and documentation",
      category: "Process Improvement",
      status: "pending",
      dueDate: "Oct 1, 2025",
      progress: 0,
    },
  ]);

  // CPF Level progression
  const cpfLevels = [
    {
      level: "CPF-1",
      title: "Junior",
      description: "Entry level position",
      minScore: 0,
    },
    {
      level: "CPF-2",
      title: "Mid-level",
      description: "Experienced contributor",
      minScore: 25,
    },
    {
      level: "CPF-3",
      title: "Senior",
      description: "Subject matter expert",
      minScore: 50,
    },
    {
      level: "CPF-4",
      title: "Lead",
      description: "Team leadership role",
      minScore: 75,
    },
    {
      level: "CPF-5",
      title: "Principal",
      description: "Strategic leadership",
      minScore: 90,
    },
  ];

  const currentCPFScore = 78; // Current score out of 100
  const currentLevel = cpfLevels.find(
    (level) =>
      currentCPFScore >= level.minScore &&
      (cpfLevels.indexOf(level) === cpfLevels.length - 1 ||
        currentCPFScore < cpfLevels[cpfLevels.indexOf(level) + 1].minScore)
  );

  const handleGoalStatusChange = (goalId: number, completed: boolean) => {
    setGoals((prev) =>
      prev.map((goal) =>
        goal.id === goalId
          ? {
              ...goal,
              status: completed ? "completed" : "pending",
              progress: completed ? 100 : 0,
            }
          : goal
      )
    );
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const newFiles = files.map((file) => file.name);
    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const removeFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileName));
  };

  const selectedEmployeeData = employees.find(
    (emp) => emp.id === selectedEmployee
  );
  const currentReview = scheduledReviews.find(
    (review) => review.id === selectedReview
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Performance Reviews
            </h1>
            <p className="text-slate-600 mt-1">
              Conduct and track employee performance evaluations
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Review
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Due This Week</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">3</p>
            <p className="text-xs text-slate-500">Reviews pending</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">In Progress</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">8</p>
            <p className="text-xs text-slate-500">Active reviews</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Completed</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">45</p>
            <p className="text-xs text-slate-500">This quarter</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Avg Score</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">4.2</p>
            <p className="text-xs text-slate-500">Out of 5.0</p>
          </div>
        </div>

        {/* Employee & Review Selector */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="employee-select">Select Employee</Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((employee) => (
                  <SelectItem key={employee.id} value={employee.id}>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {employee.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{employee.name}</p>
                        <p className="text-xs text-slate-500">
                          {employee.department} - {employee.role}
                        </p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-select">Select Review</Label>
            <Select value={selectedReview} onValueChange={setSelectedReview}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a review" />
              </SelectTrigger>
              <SelectContent>
                {scheduledReviews
                  .filter(
                    (review) => review.employee === selectedEmployeeData?.name
                  )
                  .map((review) => (
                    <SelectItem key={review.id} value={review.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>
                          {review.type} - {review.scheduledDate}
                        </span>
                        <Badge
                          variant={
                            review.status === "Completed"
                              ? "default"
                              : review.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                          className="ml-2"
                        >
                          {review.status}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scheduled Reviews List */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Scheduled Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reviewer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scheduledReviews.map((review) => (
                    <TableRow key={review.id}>
                      <TableCell className="font-medium">
                        {review.employee}
                      </TableCell>
                      <TableCell>{review.type}</TableCell>
                      <TableCell>{review.reviewer}</TableCell>
                      <TableCell>{review.scheduledDate}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            review.status === "Completed"
                              ? "default"
                              : review.status === "In Progress"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {review.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={review.progress}
                            className="w-16 h-2"
                          />
                          <span className="text-sm text-slate-500">
                            {review.progress}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Review Content Tabs */}
          <Card className="border-slate-200">
            <Tabs defaultValue="notes" className="w-full">
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="notes">Notes & Feedback</TabsTrigger>
                  <TabsTrigger value="goals">Goals & Action Items</TabsTrigger>
                  <TabsTrigger value="files">Documents</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="notes" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    {/* Notes Editor Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-slate-900">
                          Review Notes
                        </h3>
                        <div className="flex items-center gap-2">
                          <Switch
                            id="notes-visibility"
                            checked={isNotesPrivate}
                            onCheckedChange={setIsNotesPrivate}
                          />
                          <Label htmlFor="notes-visibility" className="text-sm">
                            {isNotesPrivate ? (
                              <span className="flex items-center gap-1">
                                <EyeOff className="w-4 h-4" />
                                Private
                              </span>
                            ) : (
                              <span className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                Shared
                              </span>
                            )}
                          </Label>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Notes
                      </Button>
                    </div>

                    {/* Notes Editor */}
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Enter your review notes and feedback here..."
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        rows={12}
                        className="resize-none"
                      />
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        {isNotesPrivate ? (
                          <>
                            <EyeOff className="w-3 h-3" />
                            <span>
                              Private notes - only visible to managers and HR
                            </span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" />
                            <span>Shared notes - visible to employee</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Pre-filled Example Content */}
                    <div className="bg-slate-50 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">
                        Previous Review Summary
                      </h4>
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>Strengths:</strong> Sarah consistently delivers
                        high-quality code and shows excellent problem-solving
                        skills. She has taken initiative in mentoring junior
                        developers and contributing to architectural decisions.
                      </p>
                      <p className="text-sm text-slate-600 mb-2">
                        <strong>Areas for Improvement:</strong> Could benefit
                        from improving communication in cross-team
                        collaborations and taking on more leadership
                        responsibilities in project planning.
                      </p>
                      <p className="text-sm text-slate-600">
                        <strong>Next Quarter Focus:</strong> Lead the e-commerce
                        platform redesign project and establish mentorship
                        program for junior developers.
                      </p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Goals & Action Items
                      </h3>
                      <Button size="sm" variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Goal
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {goals.map((goal) => (
                        <div
                          key={goal.id}
                          className="border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={goal.status === "completed"}
                              onCheckedChange={(checked) =>
                                handleGoalStatusChange(
                                  goal.id,
                                  checked as boolean
                                )
                              }
                              className="mt-1"
                            />
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center justify-between">
                                <h4
                                  className={`font-medium ${goal.status === "completed" ? "line-through text-slate-500" : "text-slate-900"}`}
                                >
                                  {goal.title}
                                </h4>
                                <Badge
                                  variant={
                                    goal.status === "completed"
                                      ? "default"
                                      : goal.status === "in-progress"
                                        ? "secondary"
                                        : "outline"
                                  }
                                >
                                  {goal.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600">
                                {goal.description}
                              </p>

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={goal.progress}
                                    className="w-24 h-2"
                                  />
                                  <span className="text-xs text-slate-500">
                                    {goal.progress}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <Calendar className="w-3 h-3" />
                                  <span>Due: {goal.dueDate}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Goals Summary */}
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Goals Summary
                      </h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-700">
                            {
                              goals.filter((g) => g.status === "completed")
                                .length
                            }
                          </p>
                          <p className="text-blue-600">Completed</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-700">
                            {
                              goals.filter((g) => g.status === "in-progress")
                                .length
                            }
                          </p>
                          <p className="text-blue-600">In Progress</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-blue-700">
                            {goals.filter((g) => g.status === "pending").length}
                          </p>
                          <p className="text-blue-600">Pending</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="files" className="space-y-4 mt-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Review Documents
                      </h3>
                      <div className="flex gap-2">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Files
                        </Button>
                      </div>
                    </div>

                    {/* File Upload Area */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm text-slate-600 mb-1">
                        Drag and drop files here, or click to browse
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports PDF, JPG, PNG, DOC files up to 10MB
                      </p>
                    </div>

                    {/* Uploaded Files */}
                    {uploadedFiles.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-slate-900">
                          Uploaded Files
                        </h4>
                        {uploadedFiles.map((fileName, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <Paperclip className="w-4 h-4 text-slate-500" />
                              <span className="text-sm font-medium text-slate-900">
                                {fileName}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeFile(fileName)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Example Files */}
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-900">
                        Previous Documents
                      </h4>
                      {[
                        {
                          name: "Q2_2025_Performance_Report.pdf",
                          date: "Jun 30, 2025",
                          type: "PDF",
                        },
                        {
                          name: "Goals_Checklist_2025.docx",
                          date: "Jan 15, 2025",
                          type: "DOC",
                        },
                        {
                          name: "Training_Certificates.pdf",
                          date: "May 20, 2025",
                          type: "PDF",
                        },
                      ].map((file, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 border border-slate-200 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-500" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">
                                {file.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                Uploaded {file.date}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {file.type}
                            </Badge>
                            <Button size="sm" variant="ghost">
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Current Review Info */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Review Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {currentReview && (
                <>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {selectedEmployeeData?.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-slate-900">
                        {selectedEmployeeData?.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {selectedEmployeeData?.role}
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">
                        Review Type:
                      </span>
                      <span className="text-sm font-medium">
                        {currentReview.type}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Reviewer:</span>
                      <span className="text-sm font-medium">
                        {currentReview.reviewer}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Due Date:</span>
                      <span className="text-sm font-medium">
                        {currentReview.scheduledDate}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status:</span>
                      <Badge
                        variant={
                          currentReview.status === "Completed"
                            ? "default"
                            : currentReview.status === "In Progress"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {currentReview.status}
                      </Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* CPF Level Tracker */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                CPF Level Tracker
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {currentLevel?.level}
                </div>
                <p className="text-sm text-slate-600">{currentLevel?.title}</p>
                <p className="text-xs text-slate-500 mt-1">
                  {currentLevel?.description}
                </p>
              </div>

              <div className="space-y-3">
                {cpfLevels.map((level, index) => {
                  const isCurrentLevel = level.level === currentLevel?.level;
                  const isAchieved = currentCPFScore >= level.minScore;
                  const nextLevel = cpfLevels[index + 1];
                  const progressToNext = nextLevel
                    ? Math.min(
                        100,
                        ((currentCPFScore - level.minScore) /
                          (nextLevel.minScore - level.minScore)) *
                          100
                      )
                    : 100;

                  return (
                    <div key={level.level} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isAchieved ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-400" />
                          )}
                          <span
                            className={`text-sm font-medium ${isCurrentLevel ? "text-blue-600" : isAchieved ? "text-green-600" : "text-slate-500"}`}
                          >
                            {level.level}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {level.minScore}+ pts
                        </span>
                      </div>

                      {isCurrentLevel && nextLevel && (
                        <div className="space-y-1">
                          <Progress value={progressToNext} className="h-2" />
                          <p className="text-xs text-slate-500">
                            {Math.round(progressToNext)}% to {nextLevel.level} (
                            {nextLevel.minScore - currentCPFScore} pts needed)
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-sm font-medium text-blue-900">
                  Current Score
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {currentCPFScore}/100
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                <Edit3 className="w-4 h-4" />
                Edit Review
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Calendar className="w-4 h-4" />
                Schedule Meeting
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Export Review
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Plus className="w-4 h-4" />
                Add Goal
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
