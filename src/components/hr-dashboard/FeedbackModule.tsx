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
import { Progress } from "./ui/progress";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Switch } from "./ui/switch";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { Checkbox } from "./ui/checkbox";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  MessageSquare,
  Plus,
  Filter,
  Download,
  Eye,
  Edit3,
  Trash2,
  Send,
  Save,
  Users,
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Target,
  Lightbulb,
  Building,
  Monitor,
  UserCheck,
  Globe,
  Lock,
  CheckCircle,
  AlertCircle,
  Star,
  Smile,
  Meh,
  Frown,
  ThumbsUp,
  Heart,
} from "lucide-react";

type QuestionType = "text" | "multiple_choice" | "rating" | "yes_no";
type SurveyStatus = "draft" | "active" | "closed" | "scheduled";
type SuggestionCategory = "hr" | "tech" | "office";
type SuggestionStatus = "open" | "in_review" | "implemented" | "rejected";

interface Question {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  required: boolean;
}

interface Survey {
  id: number;
  title: string;
  description: string;
  questions: Question[];
  anonymous: boolean;
  status: SurveyStatus;
  createdDate: string;
  endDate?: string;
  responseCount: number;
  targetParticipants: number;
}

interface SurveyResponse {
  id: number;
  surveyId: number;
  respondentId?: string;
  responses: { [questionId: number]: any };
  submittedAt: string;
}

interface Suggestion {
  id: number;
  title: string;
  description: string;
  category: SuggestionCategory;
  status: SuggestionStatus;
  submittedBy?: string;
  submittedDate: string;
  votes: number;
  comments: number;
}

interface PulseData {
  date: string;
  overallSatisfaction: number;
  workload: number;
  management: number;
  culture: number;
  growth: number;
}

export function FeedbackModule() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isHRUser] = useState(true); // Mock HR permission

  // Survey Builder State
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    anonymous: false,
    questions: [] as Question[],
    endDate: "",
  });

  const [newQuestion, setNewQuestion] = useState({
    type: "text" as QuestionType,
    question: "",
    options: [""],
    required: false,
  });

  // Suggestion State
  const [newSuggestion, setNewSuggestion] = useState({
    title: "",
    description: "",
    category: "hr" as SuggestionCategory,
  });

  // Pulse Check State
  const [pulseRatings, setPulseRatings] = useState({
    overallSatisfaction: 0,
    workload: 0,
    management: 0,
    culture: 0,
    growth: 0,
  });

  // Mock Data
  const [surveys, setSurveys] = useState<Survey[]>([
    {
      id: 1,
      title: "Q3 Employee Satisfaction Survey",
      description:
        "Quarterly survey to gauge employee satisfaction and engagement levels",
      questions: [
        {
          id: 1,
          type: "rating",
          question: "How satisfied are you with your current role?",
          required: true,
        },
        {
          id: 2,
          type: "multiple_choice",
          question: "What motivates you most at work?",
          options: [
            "Recognition",
            "Growth opportunities",
            "Compensation",
            "Work-life balance",
          ],
          required: true,
        },
        {
          id: 3,
          type: "text",
          question: "What can we do to improve your work experience?",
          required: false,
        },
      ],
      anonymous: true,
      status: "active",
      createdDate: "2025-07-01",
      endDate: "2025-08-31",
      responseCount: 47,
      targetParticipants: 85,
    },
    {
      id: 2,
      title: "Remote Work Feedback",
      description: "Feedback on remote work policies and tools",
      questions: [
        {
          id: 4,
          type: "yes_no",
          question: "Are you satisfied with the current remote work setup?",
          required: true,
        },
        {
          id: 5,
          type: "text",
          question: "What tools would help you be more productive?",
          required: false,
        },
      ],
      anonymous: false,
      status: "closed",
      createdDate: "2025-06-15",
      endDate: "2025-07-15",
      responseCount: 62,
      targetParticipants: 70,
    },
  ]);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([
    {
      id: 1,
      title: "Flexible Working Hours",
      description:
        "Implement more flexible working hours to improve work-life balance for all employees",
      category: "hr",
      status: "in_review",
      submittedBy: "Sarah Johnson",
      submittedDate: "2025-08-01",
      votes: 23,
      comments: 8,
    },
    {
      id: 2,
      title: "Upgrade Development Tools",
      description:
        "Invest in better IDEs and development tools to increase productivity",
      category: "tech",
      status: "implemented",
      submittedBy: "Alex Chen",
      submittedDate: "2025-07-20",
      votes: 31,
      comments: 12,
    },
    {
      id: 3,
      title: "Better Coffee Machine",
      description:
        "Replace the current coffee machine with a higher quality one",
      category: "office",
      status: "open",
      submittedBy: "Anonymous",
      submittedDate: "2025-08-05",
      votes: 15,
      comments: 5,
    },
  ]);

  // Pulse check trend data
  const pulseData: PulseData[] = [
    {
      date: "Jan 2025",
      overallSatisfaction: 4.1,
      workload: 3.8,
      management: 4.2,
      culture: 4.0,
      growth: 3.9,
    },
    {
      date: "Feb 2025",
      overallSatisfaction: 4.0,
      workload: 3.7,
      management: 4.1,
      culture: 4.1,
      growth: 4.0,
    },
    {
      date: "Mar 2025",
      overallSatisfaction: 4.2,
      workload: 3.9,
      management: 4.3,
      culture: 4.2,
      growth: 4.1,
    },
    {
      date: "Apr 2025",
      overallSatisfaction: 4.1,
      workload: 3.6,
      management: 4.0,
      culture: 4.0,
      growth: 3.8,
    },
    {
      date: "May 2025",
      overallSatisfaction: 4.3,
      workload: 4.0,
      management: 4.4,
      culture: 4.3,
      growth: 4.2,
    },
    {
      date: "Jun 2025",
      overallSatisfaction: 4.2,
      workload: 3.9,
      management: 4.2,
      culture: 4.1,
      growth: 4.0,
    },
    {
      date: "Jul 2025",
      overallSatisfaction: 4.4,
      workload: 4.1,
      management: 4.3,
      culture: 4.4,
      growth: 4.3,
    },
    {
      date: "Aug 2025",
      overallSatisfaction: 4.3,
      workload: 4.0,
      management: 4.2,
      culture: 4.2,
      growth: 4.1,
    },
  ];

  // Survey results data for charts
  const satisfactionData = [
    { name: "Very Satisfied", value: 35, count: 16, color: "#10b981" },
    { name: "Satisfied", value: 43, count: 20, color: "#3b82f6" },
    { name: "Neutral", value: 15, count: 7, color: "#f59e0b" },
    { name: "Dissatisfied", value: 4, count: 2, color: "#ef4444" },
    { name: "Very Dissatisfied", value: 3, count: 1, color: "#dc2626" },
  ];

  const responseRateData = [
    { month: "Jan", responses: 42, target: 50 },
    { month: "Feb", responses: 38, target: 50 },
    { month: "Mar", responses: 45, target: 50 },
    { month: "Apr", responses: 41, target: 50 },
    { month: "May", responses: 48, target: 50 },
    { month: "Jun", responses: 47, target: 50 },
    { month: "Jul", responses: 49, target: 50 },
    { month: "Aug", responses: 44, target: 50 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "closed":
        return "bg-slate-100 text-slate-800";
      case "scheduled":
        return "bg-blue-100 text-blue-800";
      case "open":
        return "bg-blue-100 text-blue-800";
      case "in_review":
        return "bg-amber-100 text-amber-800";
      case "implemented":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getCategoryColor = (category: SuggestionCategory) => {
    switch (category) {
      case "hr":
        return "bg-purple-100 text-purple-800";
      case "tech":
        return "bg-blue-100 text-blue-800";
      case "office":
        return "bg-green-100 text-green-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const getCategoryIcon = (category: SuggestionCategory) => {
    switch (category) {
      case "hr":
        return Users;
      case "tech":
        return Monitor;
      case "office":
        return Building;
    }
  };

  const addQuestion = () => {
    if (!newQuestion.question.trim()) return;

    const question: Question = {
      id: Date.now(),
      type: newQuestion.type,
      question: newQuestion.question,
      options:
        newQuestion.type === "multiple_choice"
          ? newQuestion.options.filter((opt) => opt.trim())
          : undefined,
      required: newQuestion.required,
    };

    setNewSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, question],
    }));

    setNewQuestion({
      type: "text",
      question: "",
      options: [""],
      required: false,
    });
  };

  const removeQuestion = (questionId: number) => {
    setNewSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== questionId),
    }));
  };

  const addOption = () => {
    setNewQuestion((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const updateOption = (index: number, value: string) => {
    setNewQuestion((prev) => ({
      ...prev,
      options: prev.options.map((opt, i) => (i === index ? value : opt)),
    }));
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 1) {
      setNewQuestion((prev) => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
      }));
    }
  };

  const saveSurvey = () => {
    if (!newSurvey.title.trim() || newSurvey.questions.length === 0) return;

    const survey: Survey = {
      id: Date.now(),
      title: newSurvey.title,
      description: newSurvey.description,
      questions: newSurvey.questions,
      anonymous: newSurvey.anonymous,
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      endDate: newSurvey.endDate,
      responseCount: 0,
      targetParticipants: 50,
    };

    setSurveys((prev) => [...prev, survey]);

    setNewSurvey({
      title: "",
      description: "",
      anonymous: false,
      questions: [],
      endDate: "",
    });
  };

  const submitSuggestion = () => {
    if (!newSuggestion.title.trim() || !newSuggestion.description.trim())
      return;

    const suggestion: Suggestion = {
      id: Date.now(),
      title: newSuggestion.title,
      description: newSuggestion.description,
      category: newSuggestion.category,
      status: "open",
      submittedBy: "John Doe", // Current user
      submittedDate: new Date().toISOString().split("T")[0],
      votes: 0,
      comments: 0,
    };

    setSuggestions((prev) => [...prev, suggestion]);

    setNewSuggestion({
      title: "",
      description: "",
      category: "hr",
    });
  };

  const submitPulseCheck = () => {
    // In real app, this would submit to backend
    console.log("Pulse check submitted:", pulseRatings);
    setPulseRatings({
      overallSatisfaction: 0,
      workload: 0,
      management: 0,
      culture: 0,
      growth: 0,
    });
  };

  const EmojiRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
  }) => {
    const emojis = ["😢", "🙁", "😐", "🙂", "😊"];
    const colors = [
      "text-red-500",
      "text-orange-500",
      "text-yellow-500",
      "text-blue-500",
      "text-green-500",
    ];

    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium text-slate-700">{label}</Label>
        <div className="flex justify-between items-center">
          {emojis.map((emoji, index) => {
            const rating = index + 1;
            return (
              <button
                key={index}
                type="button"
                onClick={() => onChange(rating)}
                className={`text-2xl hover:scale-110 transition-transform ${
                  value === rating
                    ? colors[index]
                    : "text-slate-300 hover:text-slate-400"
                }`}
              >
                {emoji}
              </button>
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>Poor</span>
          <span>Excellent</span>
        </div>
      </div>
    );
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-slate-200 rounded-lg shadow-lg">
          <p className="font-medium text-slate-900">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Employee Feedback & Surveys
            </h1>
            <p className="text-slate-600 mt-1">
              Collect feedback, manage surveys, and track employee sentiment
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
            {isHRUser && (
              <Button className="bg-blue-600 hover:bg-blue-700" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Survey
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Active Surveys</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {surveys.filter((s) => s.status === "active").length}
            </p>
            <p className="text-xs text-slate-500">Running now</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Response Rate</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">87%</p>
            <p className="text-xs text-slate-500">This month</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Avg Satisfaction</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">4.3</p>
            <p className="text-xs text-slate-500">Out of 5.0</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Suggestions</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {suggestions.filter((s) => s.status === "open").length}
            </p>
            <p className="text-xs text-slate-500">Open suggestions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <Card className="border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
                  <TabsTrigger value="surveys">Surveys</TabsTrigger>
                  <TabsTrigger value="results">Results</TabsTrigger>
                  <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="dashboard" className="space-y-6 mt-0">
                  {/* Pulse Check Widget */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-slate-900">
                        Quick Pulse Check
                      </h3>
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-800"
                      >
                        Anonymous
                      </Badge>
                    </div>

                    <Card className="border-blue-200 bg-blue-50/50">
                      <CardContent className="p-6 space-y-6">
                        <div className="text-center">
                          <h4 className="font-medium text-slate-900 mb-2">
                            How are you feeling today?
                          </h4>
                          <p className="text-sm text-slate-600">
                            Help us understand your current work experience
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <EmojiRating
                            value={pulseRatings.overallSatisfaction}
                            onChange={(value) =>
                              setPulseRatings((prev) => ({
                                ...prev,
                                overallSatisfaction: value,
                              }))
                            }
                            label="Overall Satisfaction"
                          />
                          <EmojiRating
                            value={pulseRatings.workload}
                            onChange={(value) =>
                              setPulseRatings((prev) => ({
                                ...prev,
                                workload: value,
                              }))
                            }
                            label="Workload Balance"
                          />
                          <EmojiRating
                            value={pulseRatings.management}
                            onChange={(value) =>
                              setPulseRatings((prev) => ({
                                ...prev,
                                management: value,
                              }))
                            }
                            label="Management Support"
                          />
                          <EmojiRating
                            value={pulseRatings.culture}
                            onChange={(value) =>
                              setPulseRatings((prev) => ({
                                ...prev,
                                culture: value,
                              }))
                            }
                            label="Team Culture"
                          />
                        </div>

                        <div className="flex justify-center">
                          <Button
                            onClick={submitPulseCheck}
                            disabled={Object.values(pulseRatings).some(
                              (rating) => rating === 0
                            )}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Pulse Check
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Survey Activity */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Recent Survey Activity
                    </h3>
                    <div className="space-y-3">
                      {surveys.slice(0, 3).map((survey) => (
                        <div
                          key={survey.id}
                          className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900">
                              {survey.title}
                            </h4>
                            <p className="text-sm text-slate-600 mt-1">
                              {survey.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-400" />
                                <span className="text-xs text-slate-500">
                                  {survey.responseCount}/
                                  {survey.targetParticipants} responses
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                {survey.anonymous ? (
                                  <Lock className="w-3 h-3 text-slate-400" />
                                ) : (
                                  <Globe className="w-3 h-3 text-slate-400" />
                                )}
                                <span className="text-xs text-slate-500">
                                  {survey.anonymous ? "Anonymous" : "Named"}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              variant="outline"
                              className={getStatusColor(survey.status)}
                            >
                              {survey.status}
                            </Badge>
                            <Progress
                              value={
                                (survey.responseCount /
                                  survey.targetParticipants) *
                                100
                              }
                              className="w-16 h-2"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Trend Overview */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Satisfaction Trends
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={pulseData}
                          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#e2e8f0"
                          />
                          <XAxis
                            dataKey="date"
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                          />
                          <YAxis
                            stroke="#64748b"
                            fontSize={12}
                            tick={{ fill: "#64748b" }}
                            domain={[0, 5]}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Line
                            type="monotone"
                            dataKey="overallSatisfaction"
                            stroke="#2563eb"
                            strokeWidth={2}
                            name="Overall Satisfaction"
                          />
                          <Line
                            type="monotone"
                            dataKey="management"
                            stroke="#10b981"
                            strokeWidth={2}
                            name="Management"
                          />
                          <Line
                            type="monotone"
                            dataKey="culture"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            name="Culture"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="surveys" className="space-y-6 mt-0">
                  {isHRUser ? (
                    <>
                      {/* Survey Builder */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-slate-900">
                            Survey Builder
                          </h3>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-800 border-red-200"
                          >
                            HR Only
                          </Badge>
                        </div>

                        <Card className="border-slate-200">
                          <CardHeader>
                            <CardTitle className="text-lg">
                              Create New Survey
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="survey-title">
                                  Survey Title
                                </Label>
                                <Input
                                  id="survey-title"
                                  placeholder="e.g., Q4 Employee Satisfaction"
                                  value={newSurvey.title}
                                  onChange={(e) =>
                                    setNewSurvey((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="survey-end-date">
                                  End Date
                                </Label>
                                <Input
                                  id="survey-end-date"
                                  type="date"
                                  value={newSurvey.endDate}
                                  onChange={(e) =>
                                    setNewSurvey((prev) => ({
                                      ...prev,
                                      endDate: e.target.value,
                                    }))
                                  }
                                />
                              </div>
                            </div>

                            <div className="space-y-2">
                              <Label htmlFor="survey-description">
                                Description
                              </Label>
                              <Textarea
                                id="survey-description"
                                placeholder="Brief description of the survey purpose..."
                                value={newSurvey.description}
                                onChange={(e) =>
                                  setNewSurvey((prev) => ({
                                    ...prev,
                                    description: e.target.value,
                                  }))
                                }
                                rows={3}
                              />
                            </div>

                            <div className="flex items-center space-x-2">
                              <Switch
                                id="anonymous-toggle"
                                checked={newSurvey.anonymous}
                                onCheckedChange={(checked) =>
                                  setNewSurvey((prev) => ({
                                    ...prev,
                                    anonymous: checked,
                                  }))
                                }
                              />
                              <Label htmlFor="anonymous-toggle">
                                Anonymous Survey
                              </Label>
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-slate-900">
                                Questions
                              </h4>

                              {/* Existing Questions */}
                              {newSurvey.questions.map((question, index) => (
                                <div
                                  key={question.id}
                                  className="p-4 border border-slate-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-slate-700">
                                          Q{index + 1}
                                        </span>
                                        <Badge
                                          variant="outline"
                                          className="text-xs"
                                        >
                                          {question.type.replace("_", " ")}
                                        </Badge>
                                        {question.required && (
                                          <Badge
                                            variant="outline"
                                            className="text-xs bg-red-50 text-red-800"
                                          >
                                            Required
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-sm text-slate-900 mb-2">
                                        {question.question}
                                      </p>
                                      {question.options && (
                                        <ul className="text-sm text-slate-600 ml-4">
                                          {question.options.map(
                                            (option, idx) => (
                                              <li
                                                key={idx}
                                                className="list-disc"
                                              >
                                                {option}
                                              </li>
                                            )
                                          )}
                                        </ul>
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        removeQuestion(question.id)
                                      }
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}

                              {/* Add New Question */}
                              <Card className="border-dashed border-slate-300">
                                <CardContent className="p-4 space-y-4">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                      <Label>Question Type</Label>
                                      <Select
                                        value={newQuestion.type}
                                        onValueChange={(value: QuestionType) =>
                                          setNewQuestion((prev) => ({
                                            ...prev,
                                            type: value,
                                          }))
                                        }
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="text">
                                            Text Field
                                          </SelectItem>
                                          <SelectItem value="multiple_choice">
                                            Multiple Choice
                                          </SelectItem>
                                          <SelectItem value="rating">
                                            Rating (1-5)
                                          </SelectItem>
                                          <SelectItem value="yes_no">
                                            Yes/No
                                          </SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-end">
                                      <div className="flex items-center space-x-2">
                                        <Switch
                                          id="required-toggle"
                                          checked={newQuestion.required}
                                          onCheckedChange={(checked) =>
                                            setNewQuestion((prev) => ({
                                              ...prev,
                                              required: checked,
                                            }))
                                          }
                                        />
                                        <Label
                                          htmlFor="required-toggle"
                                          className="text-sm"
                                        >
                                          Required
                                        </Label>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Question</Label>
                                    <Input
                                      placeholder="Enter your question..."
                                      value={newQuestion.question}
                                      onChange={(e) =>
                                        setNewQuestion((prev) => ({
                                          ...prev,
                                          question: e.target.value,
                                        }))
                                      }
                                    />
                                  </div>

                                  {newQuestion.type === "multiple_choice" && (
                                    <div className="space-y-3">
                                      <Label>Options</Label>
                                      {newQuestion.options.map(
                                        (option, index) => (
                                          <div
                                            key={index}
                                            className="flex gap-2"
                                          >
                                            <Input
                                              placeholder={`Option ${index + 1}`}
                                              value={option}
                                              onChange={(e) =>
                                                updateOption(
                                                  index,
                                                  e.target.value
                                                )
                                              }
                                            />
                                            <Button
                                              type="button"
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                removeOption(index)
                                              }
                                              disabled={
                                                newQuestion.options.length <= 1
                                              }
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        )
                                      )}
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addOption}
                                      >
                                        <Plus className="w-4 h-4 mr-2" />
                                        Add Option
                                      </Button>
                                    </div>
                                  )}

                                  <div className="flex gap-2">
                                    <Button
                                      onClick={addQuestion}
                                      disabled={!newQuestion.question.trim()}
                                      size="sm"
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Add Question
                                    </Button>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>

                            <div className="flex gap-2 pt-4 border-t border-slate-200">
                              <Button
                                onClick={saveSurvey}
                                disabled={
                                  !newSurvey.title.trim() ||
                                  newSurvey.questions.length === 0
                                }
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Survey
                              </Button>
                              <Button variant="outline">Preview</Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Existing Surveys */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-slate-900">
                          Manage Surveys
                        </h3>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Survey</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Responses</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {surveys.map((survey) => (
                                <TableRow key={survey.id}>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium text-slate-900">
                                        {survey.title}
                                      </p>
                                      <p className="text-sm text-slate-500 mt-1">
                                        {survey.description}
                                      </p>
                                      <div className="flex items-center gap-2 mt-1">
                                        {survey.anonymous ? (
                                          <Lock className="w-3 h-3 text-slate-400" />
                                        ) : (
                                          <Globe className="w-3 h-3 text-slate-400" />
                                        )}
                                        <span className="text-xs text-slate-500">
                                          {survey.anonymous
                                            ? "Anonymous"
                                            : "Named"}
                                        </span>
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant="outline"
                                      className={getStatusColor(survey.status)}
                                    >
                                      {survey.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="font-medium">
                                        {survey.responseCount}/
                                        {survey.targetParticipants}
                                      </p>
                                      <Progress
                                        value={
                                          (survey.responseCount /
                                            survey.targetParticipants) *
                                          100
                                        }
                                        className="w-16 h-2 mt-1"
                                      />
                                    </div>
                                  </TableCell>
                                  <TableCell>{survey.createdDate}</TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm">
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <Edit3 className="w-4 h-4" />
                                      </Button>
                                      <Button variant="ghost" size="sm">
                                        <BarChart3 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-900 mb-2">
                        Access Restricted
                      </h3>
                      <p className="text-slate-600">
                        Survey creation and management is available to HR
                        personnel only.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    <h3 className="font-medium text-slate-900">
                      Survey Results Dashboard
                    </h3>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-green-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-medium text-green-900">
                            Avg Response Rate
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">87%</p>
                        <p className="text-xs text-green-600">
                          Across all surveys
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Star className="w-4 h-4 text-blue-600" />
                          <p className="text-sm font-medium text-blue-900">
                            Satisfaction Score
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          4.3/5.0
                        </p>
                        <p className="text-xs text-blue-600">Latest survey</p>
                      </div>
                      <div className="bg-amber-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-900">
                            Engagement Trend
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">
                          ↗ 12%
                        </p>
                        <p className="text-xs text-amber-600">
                          vs last quarter
                        </p>
                      </div>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Satisfaction Distribution */}
                      <div>
                        <h4 className="font-medium text-slate-900 mb-4">
                          Satisfaction Distribution
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={satisfactionData}
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                dataKey="count"
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {satisfactionData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                  />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Response Rate Trends */}
                      <div>
                        <h4 className="font-medium text-slate-900 mb-4">
                          Response Rate Trends
                        </h4>
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={responseRateData}
                              margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                              }}
                            >
                              <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#e2e8f0"
                              />
                              <XAxis
                                dataKey="month"
                                stroke="#64748b"
                                fontSize={12}
                                tick={{ fill: "#64748b" }}
                              />
                              <YAxis
                                stroke="#64748b"
                                fontSize={12}
                                tick={{ fill: "#64748b" }}
                              />
                              <Tooltip
                                formatter={(value, name) => [
                                  value,
                                  name === "responses" ? "Responses" : "Target",
                                ]}
                                labelFormatter={(label) => `Month: ${label}`}
                              />
                              <Bar
                                dataKey="responses"
                                fill="#2563eb"
                                radius={[4, 4, 0, 0]}
                              />
                              <Bar
                                dataKey="target"
                                fill="#e2e8f0"
                                radius={[4, 4, 0, 0]}
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* Pulse Data Trends */}
                    <div>
                      <h4 className="font-medium text-slate-900 mb-4">
                        Pulse Check Trends
                      </h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart
                            data={pulseData}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#e2e8f0"
                            />
                            <XAxis
                              dataKey="date"
                              stroke="#64748b"
                              fontSize={12}
                              tick={{ fill: "#64748b" }}
                            />
                            <YAxis
                              stroke="#64748b"
                              fontSize={12}
                              tick={{ fill: "#64748b" }}
                              domain={[0, 5]}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                              type="monotone"
                              dataKey="overallSatisfaction"
                              stroke="#2563eb"
                              strokeWidth={2}
                              name="Overall"
                            />
                            <Line
                              type="monotone"
                              dataKey="workload"
                              stroke="#ef4444"
                              strokeWidth={2}
                              name="Workload"
                            />
                            <Line
                              type="monotone"
                              dataKey="management"
                              stroke="#10b981"
                              strokeWidth={2}
                              name="Management"
                            />
                            <Line
                              type="monotone"
                              dataKey="culture"
                              stroke="#f59e0b"
                              strokeWidth={2}
                              name="Culture"
                            />
                            <Line
                              type="monotone"
                              dataKey="growth"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              name="Growth"
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    <h3 className="font-medium text-slate-900">
                      Suggestion Box
                    </h3>

                    {/* Submit Suggestion Form */}
                    <Card className="border-slate-200">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Submit a Suggestion
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="suggestion-title">Title</Label>
                            <Input
                              id="suggestion-title"
                              placeholder="Brief title for your suggestion"
                              value={newSuggestion.title}
                              onChange={(e) =>
                                setNewSuggestion((prev) => ({
                                  ...prev,
                                  title: e.target.value,
                                }))
                              }
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Category</Label>
                            <Select
                              value={newSuggestion.category}
                              onValueChange={(value: SuggestionCategory) =>
                                setNewSuggestion((prev) => ({
                                  ...prev,
                                  category: value,
                                }))
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="hr">
                                  <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4" />
                                    HR & People
                                  </div>
                                </SelectItem>
                                <SelectItem value="tech">
                                  <div className="flex items-center gap-2">
                                    <Monitor className="w-4 h-4" />
                                    Technology & Tools
                                  </div>
                                </SelectItem>
                                <SelectItem value="office">
                                  <div className="flex items-center gap-2">
                                    <Building className="w-4 h-4" />
                                    Office & Environment
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="suggestion-description">
                            Description
                          </Label>
                          <Textarea
                            id="suggestion-description"
                            placeholder="Provide details about your suggestion and how it could improve our workplace..."
                            value={newSuggestion.description}
                            onChange={(e) =>
                              setNewSuggestion((prev) => ({
                                ...prev,
                                description: e.target.value,
                              }))
                            }
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={submitSuggestion}
                            disabled={
                              !newSuggestion.title.trim() ||
                              !newSuggestion.description.trim()
                            }
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Suggestion
                          </Button>
                          <Button variant="outline">Save Draft</Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Existing Suggestions */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-slate-900">
                          All Suggestions
                        </h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter by Category
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {suggestions.map((suggestion) => {
                          const CategoryIcon = getCategoryIcon(
                            suggestion.category
                          );
                          return (
                            <Card
                              key={suggestion.id}
                              className="border-slate-200"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <CategoryIcon className="w-4 h-4 text-slate-500" />
                                      <h4 className="font-medium text-slate-900">
                                        {suggestion.title}
                                      </h4>
                                      <Badge
                                        variant="outline"
                                        className={getCategoryColor(
                                          suggestion.category
                                        )}
                                      >
                                        {suggestion.category.toUpperCase()}
                                      </Badge>
                                      <Badge
                                        variant="outline"
                                        className={getStatusColor(
                                          suggestion.status
                                        )}
                                      >
                                        {suggestion.status.replace("_", " ")}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-slate-600 mb-3">
                                      {suggestion.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-slate-500">
                                      <span>
                                        By:{" "}
                                        {suggestion.submittedBy || "Anonymous"}
                                      </span>
                                      <span>
                                        Submitted: {suggestion.submittedDate}
                                      </span>
                                      <div className="flex items-center gap-1">
                                        <ThumbsUp className="w-3 h-3" />
                                        <span>{suggestion.votes} votes</span>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3" />
                                        <span>
                                          {suggestion.comments} comments
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="text-blue-600 hover:text-blue-700"
                                    >
                                      <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="sm">
                                      <MessageSquare className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-4 h-4 text-purple-600" />
                          <p className="font-medium text-purple-900">
                            HR & People
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">
                          {
                            suggestions.filter((s) => s.category === "hr")
                              .length
                          }
                        </p>
                        <p className="text-xs text-purple-600">suggestions</p>
                      </div>
                      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Monitor className="w-4 h-4 text-blue-600" />
                          <p className="font-medium text-blue-900">
                            Technology
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">
                          {
                            suggestions.filter((s) => s.category === "tech")
                              .length
                          }
                        </p>
                        <p className="text-xs text-blue-600">suggestions</p>
                      </div>
                      <div className="border border-green-200 rounded-lg p-4 bg-green-50">
                        <div className="flex items-center gap-2 mb-2">
                          <Building className="w-4 h-4 text-green-600" />
                          <p className="font-medium text-green-900">Office</p>
                        </div>
                        <p className="text-2xl font-bold text-green-700">
                          {
                            suggestions.filter((s) => s.category === "office")
                              .length
                          }
                        </p>
                        <p className="text-xs text-green-600">suggestions</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700">
                <Heart className="w-4 h-4" />
                Quick Pulse Check
              </Button>
              {isHRUser && (
                <>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create Survey
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Results
                  </Button>
                </>
              )}
              <Button variant="outline" className="w-full justify-start gap-2">
                <Lightbulb className="w-4 h-4" />
                Submit Suggestion
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Download className="w-4 h-4" />
                Export Report
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      New suggestion submitted
                    </p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      Pulse check completed
                    </p>
                    <p className="text-xs text-slate-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      Survey response received
                    </p>
                    <p className="text-xs text-slate-500">6 hours ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Satisfaction */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Star className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Team Satisfaction
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Current average: 4.3/5.0 based on recent pulse checks
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Trending up ↗ 12% from last month
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
