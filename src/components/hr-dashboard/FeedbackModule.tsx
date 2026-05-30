import { useEffect, useState } from "react";
import { getAccessToken } from "@/lib/api/tokens";
import { fetchUserProfiles } from "@/lib/api/reviews";
import {
  createSurvey,
  fetchSurveyAnalytics,
  fetchSurveys,
  submitSurveyResponse,
  updateSurvey,
  type Survey as ApiSurvey,
  type SurveyAnalytics,
  type SurveyQuestion as ApiSurveyQuestion,
} from "@/lib/api/feedback";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
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
import { QuickActionButton } from "./QuickActionButton";
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
  Laugh,
  ThumbsUp,
  Heart,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { isHrLikeRole } from "@/lib/permissions/assets-permissions";

interface FeedbackTooltipProps {
  active?: boolean;
  payload?: Array<{ color?: string; dataKey?: string; value?: number }>;
  label?: string;
}

function FeedbackTooltip({ active, payload, label }: FeedbackTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map(
          (
            entry: { color?: string; dataKey?: string; value?: number },
            index: number
          ) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.dataKey}: {entry.value}
            </p>
          )
        )}
      </div>
    );
  }
  return null;
}

function EmojiRating({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  const ratingIcons = [
    { Icon: Frown, label: "Poor" },
    { Icon: Frown, label: "Fair" },
    { Icon: Meh, label: "Okay" },
    { Icon: Smile, label: "Good" },
    { Icon: Laugh, label: "Excellent" },
  ];
  const colors = [
    "text-red-500",
    "text-orange-500",
    "text-yellow-500",
    "text-blue-500",
    "text-green-500",
  ];

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="flex justify-between items-center">
        {ratingIcons.map(({ Icon }, index) => {
          const rating = index + 1;
          return (
            <button
              key={index}
              type="button"
              onClick={() => onChange(rating)}
              className={`p-1 hover:scale-110 transition-transform ${
                value === rating
                  ? colors[index]
                  : "text-gray-300 hover:text-gray-400"
              }`}
              title={ratingIcons[index].label}
            >
              <Icon className="h-7 w-7" />
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>Poor</span>
        <span>Excellent</span>
      </div>
    </div>
  );
}

type QuestionType = "text" | "multiple_choice" | "rating" | "yes_no";
type SurveyStatus = "draft" | "active" | "closed";
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
  createdByName: string;
  forbiddenUserIds: number[];
}

interface SurveyResponse {
  id: number;
  surveyId: number;
  respondentId?: string;
  responses: { [questionId: number]: unknown };
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
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("dashboard");
  const sessionUser = session?.user as
    | {
        role?: string;
        career_level?: string;
        is_staff?: boolean;
        is_superuser?: boolean;
      }
    | undefined;
  const roleSource = sessionUser?.role || sessionUser?.career_level;
  const isHRUser =
    isHrLikeRole(roleSource) ||
    !!sessionUser?.is_staff ||
    !!sessionUser?.is_superuser;

  // Survey Builder State
  const [newSurvey, setNewSurvey] = useState({
    title: "",
    description: "",
    anonymous: false,
    questions: [] as Question[],
    endDate: "",
    forbiddenUserIds: [] as number[],
  });

  const [newQuestion, setNewQuestion] = useState({
    type: "text" as QuestionType,
    question: "",
    options: [""],
    required: true,
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

  // Analytics State (BHB-453)
  const [analyticsSurveyId, setAnalyticsSurveyId] = useState<number | null>(
    null
  );
  const [analyticsFilters, setAnalyticsFilters] = useState<{
    department: string;
    startDate: string;
    endDate: string;
  }>({ department: "", startDate: "", endDate: "" });
  const [analytics, setAnalytics] = useState<SurveyAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);

  // Take-survey dialog state (BHB-453 — test-driving end-to-end)
  const [takingSurvey, setTakingSurvey] = useState<Survey | null>(null);
  const [takeDraft, setTakeDraft] = useState<Record<number, string>>({});
  const [submittingResponse, setSubmittingResponse] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Preview + Edit dialog state
  const [previewSurvey, setPreviewSurvey] = useState<Survey | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [editDraft, setEditDraft] = useState<{
    title: string;
    description: string;
    anonymous: boolean;
    status: SurveyStatus;
    endDate: string;
    questions: Question[];
    forbiddenUserIds: number[];
  }>({
    title: "",
    description: "",
    anonymous: false,
    status: "draft",
    endDate: "",
    questions: [],
    forbiddenUserIds: [],
  });
  const [editNewQuestion, setEditNewQuestion] = useState({
    type: "text" as QuestionType,
    question: "",
    options: [""],
    required: true,
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Surveys + suggestions load from the API; start empty.
  // `surveys`  = surveys created by the current user (management table)
  // `availableSurveys` = all active surveys (Take Survey section)
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [availableSurveys, setAvailableSurveys] = useState<Survey[]>([]);
  // Org user directory (for the visibility / forbidden-users picker).
  const [orgUsers, setOrgUsers] = useState<{ id: number; name: string }[]>([]);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-amber-100 text-amber-800";
      case "closed":
        return "bg-gray-100 text-gray-800";
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
        return "bg-gray-100 text-gray-800";
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
        return "bg-gray-100 text-gray-800";
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
      required: true,
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

  // Translate the FE-local question shape into the API question shape.
  const toApiQuestion = (q: Question): ApiSurveyQuestion => {
    const base = { required: q.required };
    switch (q.type) {
      case "multiple_choice":
        return {
          ...base,
          text: q.question,
          type: "choice",
          options: (q.options ?? []).filter((opt) => opt.trim() !== ""),
        };
      case "yes_no":
        return {
          ...base,
          text: q.question,
          type: "choice",
          options: ["Yes", "No"],
        };
      case "rating":
        return { ...base, text: q.question, type: "scale" };
      default:
        return { ...base, text: q.question, type: "text" };
    }
  };

  // Translate API survey shape back into the FE-local shape used by the UI.
  const fromApiSurvey = (s: ApiSurvey): Survey => {
    const questions: Question[] = s.questions.map((q, idx) => ({
      id: q.id ?? idx + 1,
      type:
        q.type === "scale"
          ? "rating"
          : q.type === "choice"
            ? "multiple_choice"
            : "text",
      question: q.text,
      options: q.options,
      required: q.required ?? true,
    }));
    return {
      id: s.id,
      title: s.title,
      description: s.description,
      questions,
      anonymous: s.is_anonymous,
      status:
        s.status === "draft" || s.status === "active" || s.status === "closed"
          ? s.status
          : "draft",
      createdDate: s.created_at?.split("T")[0] ?? "",
      endDate: s.end_date ?? "",
      responseCount: s.response_count,
      createdByName: s.created_by_name ?? "",
      forbiddenUserIds: s.forbidden_user_ids ?? [],
    };
  };

  // Load surveys on mount: my own (for management) and all active (for Take).
  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    void Promise.all([
      fetchSurveys(token, { mine: true }).catch(() => [] as ApiSurvey[]),
      fetchSurveys(token).catch(() => [] as ApiSurvey[]),
      fetchUserProfiles(token).catch(() => []),
    ]).then(([mine, all, users]) => {
      if (cancelled) return;
      setSurveys(mine.map(fromApiSurvey));
      setAvailableSurveys(all.map(fromApiSurvey));
      setOrgUsers(users);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch analytics when the selected survey or filters change.
  useEffect(() => {
    if (analyticsSurveyId === null) {
      setAnalytics(null);
      return;
    }
    const token = getAccessToken();
    if (!token) return;
    let cancelled = false;
    setAnalyticsLoading(true);
    setAnalyticsError(null);
    void fetchSurveyAnalytics(
      analyticsSurveyId,
      {
        department: analyticsFilters.department || undefined,
        startDate: analyticsFilters.startDate || undefined,
        endDate: analyticsFilters.endDate || undefined,
      },
      token
    )
      .then((data) => {
        if (cancelled) return;
        setAnalytics(data);
      })
      .catch((err: Error) => {
        if (cancelled) return;
        setAnalyticsError(err.message || "Failed to load analytics.");
        setAnalytics(null);
      })
      .finally(() => {
        if (!cancelled) setAnalyticsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [analyticsSurveyId, analyticsFilters]);

  const saveSurvey = async () => {
    if (!newSurvey.title.trim() || newSurvey.questions.length === 0) return;

    const token = getAccessToken();
    const payload = {
      title: newSurvey.title,
      description: newSurvey.description,
      is_anonymous: newSurvey.anonymous,
      end_date: newSurvey.endDate || null,
      forbidden_user_ids: newSurvey.forbiddenUserIds,
      questions: newSurvey.questions.map(toApiQuestion),
    };

    // eslint-disable-next-line react-hooks/purity
    const tempId = Date.now();
    const localFallback: Survey = {
      id: tempId,
      title: newSurvey.title,
      description: newSurvey.description,
      questions: newSurvey.questions,
      anonymous: newSurvey.anonymous,
      status: "draft",
      createdDate: new Date().toISOString().split("T")[0],
      endDate: newSurvey.endDate,
      responseCount: 0,
      createdByName: "",
      forbiddenUserIds: newSurvey.forbiddenUserIds,
    };

    if (token) {
      try {
        const created = await createSurvey(payload, token);
        setSurveys((prev) => [fromApiSurvey(created), ...prev]);
        await refreshAllSurveyLists(token);
      } catch {
        setSurveys((prev) => [localFallback, ...prev]);
      }
    } else {
      setSurveys((prev) => [localFallback, ...prev]);
    }

    setNewSurvey({
      title: "",
      description: "",
      anonymous: false,
      questions: [],
      endDate: "",
      forbiddenUserIds: [],
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

  const isSurveyLocked = (survey: Survey): boolean => {
    if (!survey.endDate) return false;
    // Compare as YYYY-MM-DD so timezone doesn't matter.
    const today = new Date().toISOString().split("T")[0];
    return survey.endDate < today;
  };

  const openEditSurvey = (survey: Survey) => {
    setEditingSurvey(survey);
    setEditDraft({
      title: survey.title,
      description: survey.description,
      anonymous: survey.anonymous,
      status: survey.status,
      endDate: survey.endDate ?? "",
      forbiddenUserIds: [...survey.forbiddenUserIds],
      // Deep-clone so edits don't mutate the original survey object.
      questions: survey.questions.map((q) => ({
        ...q,
        options: q.options ? [...q.options] : undefined,
      })),
    });
    setEditNewQuestion({
      type: "text",
      question: "",
      options: [""],
      required: true,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingSurvey) return;
    const token = getAccessToken();
    if (!token) {
      setEditingSurvey(null);
      return;
    }
    setSavingEdit(true);
    try {
      await updateSurvey(
        editingSurvey.id,
        {
          title: editDraft.title,
          description: editDraft.description,
          is_anonymous: editDraft.anonymous,
          status: editDraft.status,
          end_date: editDraft.endDate || null,
          forbidden_user_ids: editDraft.forbiddenUserIds,
          questions: editDraft.questions.map(toApiQuestion),
        },
        token
      );
      await refreshAllSurveyLists(token);
      setEditingSurvey(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const openResultsForSurvey = (surveyId: number) => {
    setAnalyticsSurveyId(surveyId);
    setAnalyticsFilters({ department: "", startDate: "", endDate: "" });
    setActiveTab("results");
  };

  const refreshAllSurveyLists = async (token: string) => {
    const [mine, all] = await Promise.all([
      fetchSurveys(token, { mine: true }).catch(() => [] as ApiSurvey[]),
      fetchSurveys(token).catch(() => [] as ApiSurvey[]),
    ]);
    setSurveys(mine.map(fromApiSurvey));
    setAvailableSurveys(all.map(fromApiSurvey));
  };

  const handleStatusChange = async (surveyId: number, status: SurveyStatus) => {
    const token = getAccessToken();
    if (!token) return;
    try {
      await updateSurvey(surveyId, { status }, token);
      await refreshAllSurveyLists(token);
    } catch {
      setSurveys((prev) =>
        prev.map((s) => (s.id === surveyId ? { ...s, status } : s))
      );
    }
  };

  const handleSendOut = (surveyId: number) =>
    handleStatusChange(surveyId, "active");

  const handleRecall = (surveyId: number) =>
    handleStatusChange(surveyId, "draft");

  const openTakeSurvey = (survey: Survey) => {
    setTakingSurvey(survey);
    setTakeDraft({});
    setSubmitError(null);
  };

  const handleSubmitResponse = async () => {
    if (!takingSurvey) return;
    const token = getAccessToken();
    if (!token) {
      setSubmitError("You need to be logged in to submit.");
      return;
    }
    const answers = takingSurvey.questions.map((q) => ({
      question_id: q.id,
      value: (takeDraft[q.id] ?? "").toString(),
    }));
    setSubmittingResponse(true);
    setSubmitError(null);
    try {
      await submitSurveyResponse(takingSurvey.id, answers, token);
      await refreshAllSurveyLists(token);
      setTakingSurvey(null);
      setTakeDraft({});
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to submit response.";
      setSubmitError(msg);
    } finally {
      setSubmittingResponse(false);
    }
  };

  const submitPulseCheck = () => {
    // TODO: Submit pulse check to backend API
    setPulseRatings({
      overallSatisfaction: 0,
      workload: 0,
      management: 0,
      culture: 0,
      growth: 0,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Employee Feedback & Surveys
            </h1>
            <p className="text-gray-600 mt-1">
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
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Active Surveys</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {availableSurveys.filter((s) => s.status === "active").length}
            </p>
            <p className="text-xs text-gray-500">Running now</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Total Responses</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {availableSurveys.reduce(
                (sum, s) => sum + (s.responseCount || 0),
                0
              )}
            </p>
            <p className="text-xs text-gray-500">Across all surveys</p>
          </div>
          {/* TODO: wire to real pulse-check average once Pulse Check ticket lands. */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Avg Satisfaction</p>
            </div>
            <p className="text-2xl font-bold text-gray-400">—</p>
            <p className="text-xs text-gray-500">Available after Pulse Check</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-4 h-4 text-gray-500" />
              <p className="text-sm text-gray-600">Suggestions</p>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {suggestions.filter((s) => s.status === "open").length}
            </p>
            <p className="text-xs text-gray-500">Open suggestions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Main Content */}
        <div>
          <Card className="border-gray-200">
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
                      <h3 className="font-medium text-gray-900">
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
                          <h4 className="font-medium text-gray-900 mb-2">
                            How are you feeling today?
                          </h4>
                          <p className="text-sm text-gray-600">
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
                            variant="primary"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Submit Pulse Check
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Available Surveys (anyone can take) */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Available Surveys
                    </h3>
                    {(() => {
                      const active = availableSurveys.filter(
                        (s) => s.status === "active"
                      );
                      if (active.length === 0) {
                        return (
                          <p className="text-sm text-gray-500 italic">
                            No active surveys right now.
                          </p>
                        );
                      }
                      return (
                        <div className="space-y-2">
                          {active.map((survey) => (
                            <div
                              key={survey.id}
                              className="flex items-center justify-between p-4 bg-blue-50 border border-blue-100 rounded-lg"
                            >
                              <div className="min-w-0 flex-1 pr-4">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-medium text-gray-900 truncate">
                                    {survey.title}
                                  </h4>
                                  {survey.anonymous && (
                                    <Badge
                                      variant="outline"
                                      className="bg-white text-blue-700 border-blue-200"
                                    >
                                      Anonymous
                                    </Badge>
                                  )}
                                </div>
                                {survey.description && (
                                  <p className="text-sm text-gray-600 mt-1 truncate">
                                    {survey.description}
                                  </p>
                                )}
                              </div>
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() => openTakeSurvey(survey)}
                                disabled={
                                  survey.questions.length === 0 ||
                                  isSurveyLocked(survey)
                                }
                                title={
                                  isSurveyLocked(survey)
                                    ? `Survey ended ${survey.endDate}`
                                    : undefined
                                }
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Take Survey
                              </Button>
                            </div>
                          ))}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Recent Survey Activity */}
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900">
                      Recent Survey Activity
                    </h3>
                    {surveys.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">
                        No surveys yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {surveys.slice(0, 3).map((survey) => (
                          <div
                            key={survey.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                          >
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">
                                {survey.title}
                              </h4>
                              {survey.description && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {survey.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-500">
                                    {survey.responseCount} responses
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  {survey.anonymous ? (
                                    <Lock className="w-3 h-3 text-gray-400" />
                                  ) : (
                                    <Globe className="w-3 h-3 text-gray-400" />
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {survey.anonymous ? "Anonymous" : "Named"}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className={getStatusColor(survey.status)}
                            >
                              {survey.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="surveys" className="space-y-6 mt-0">
                  {isHRUser ? (
                    <>
                      {/* Survey Builder */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-gray-900">
                            Survey Builder
                          </h3>
                          <Badge
                            variant="outline"
                            className="bg-red-50 text-red-800 border-red-200"
                          >
                            HR Only
                          </Badge>
                        </div>

                        <Card className="border-gray-200">
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

                            {/* Visibility — forbid specific users */}
                            <div className="space-y-2">
                              <Label className="text-sm">
                                Forbid users from this survey (optional)
                              </Label>
                              <p className="text-xs text-gray-500">
                                Selected users will not see or be able to take
                                this survey.
                              </p>
                              <div className="border border-gray-200 rounded p-2 max-h-40 overflow-y-auto space-y-1">
                                {orgUsers.length === 0 ? (
                                  <p className="text-xs text-gray-500 italic">
                                    No users loaded.
                                  </p>
                                ) : (
                                  orgUsers.map((u) => {
                                    const checked =
                                      newSurvey.forbiddenUserIds.includes(u.id);
                                    return (
                                      <label
                                        key={u.id}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                      >
                                        <Checkbox
                                          checked={checked}
                                          onCheckedChange={(v) =>
                                            setNewSurvey((prev) => ({
                                              ...prev,
                                              forbiddenUserIds: v
                                                ? [
                                                    ...prev.forbiddenUserIds,
                                                    u.id,
                                                  ]
                                                : prev.forbiddenUserIds.filter(
                                                    (id) => id !== u.id
                                                  ),
                                            }))
                                          }
                                        />
                                        <span>{u.name}</span>
                                      </label>
                                    );
                                  })
                                )}
                              </div>
                              {newSurvey.forbiddenUserIds.length > 0 && (
                                <p className="text-xs text-amber-700">
                                  {newSurvey.forbiddenUserIds.length} user(s)
                                  forbidden.
                                </p>
                              )}
                            </div>

                            {/* Questions */}
                            <div className="space-y-4">
                              <h4 className="font-medium text-gray-900">
                                Questions
                              </h4>

                              {/* Existing Questions */}
                              {newSurvey.questions.map((question, index) => (
                                <div
                                  key={question.id}
                                  className="p-4 border border-gray-200 rounded-lg"
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span className="text-sm font-medium text-gray-700">
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
                                      <p className="text-sm text-gray-900 mb-2">
                                        {question.question}
                                      </p>
                                      {question.options && (
                                        <ul className="text-sm text-gray-600 ml-4">
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
                              <Card className="border-dashed border-gray-300">
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

                            <div className="flex gap-2 pt-4 border-t border-gray-200">
                              <Button
                                onClick={() => void saveSurvey()}
                                disabled={
                                  !newSurvey.title.trim() ||
                                  newSurvey.questions.length === 0
                                }
                                variant="primary"
                              >
                                <Save className="w-4 h-4 mr-2" />
                                Save Survey
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Existing Surveys */}
                      <div className="space-y-4">
                        <h3 className="font-medium text-gray-900">
                          Manage Surveys
                        </h3>
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
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
                                      <p className="font-medium text-gray-900">
                                        {survey.title}
                                      </p>
                                      {survey.description && (
                                        <p className="text-sm text-gray-500 mt-1">
                                          {survey.description}
                                        </p>
                                      )}
                                      <div className="flex items-center gap-2 mt-1">
                                        {survey.anonymous ? (
                                          <Lock className="w-3 h-3 text-gray-400" />
                                        ) : (
                                          <Users className="w-3 h-3 text-gray-400" />
                                        )}
                                        <span
                                          className="text-xs text-gray-500"
                                          title={
                                            survey.anonymous
                                              ? "Respondents are not stored"
                                              : "Responses are linked to the respondent"
                                          }
                                        >
                                          {survey.anonymous
                                            ? "Anonymous"
                                            : "Not Anonymous"}
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
                                    <p className="font-medium">
                                      {survey.responseCount}
                                    </p>
                                  </TableCell>
                                  <TableCell>
                                    <p>{survey.createdDate}</p>
                                    {survey.createdByName && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        by {survey.createdByName}
                                      </p>
                                    )}
                                    {survey.endDate && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        ends {survey.endDate}
                                      </p>
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1 items-center">
                                      {isSurveyLocked(survey) && (
                                        <Badge
                                          variant="outline"
                                          className="bg-gray-100 text-gray-700 border-gray-200 mr-1"
                                          title={`Locked — ended ${survey.endDate}`}
                                        >
                                          <Lock className="w-3 h-3 mr-1" />
                                          Locked
                                        </Badge>
                                      )}
                                      {survey.status === "draft" &&
                                        !isSurveyLocked(survey) && (
                                          <Button
                                            variant="primary"
                                            size="sm"
                                            onClick={() =>
                                              void handleSendOut(survey.id)
                                            }
                                          >
                                            <Send className="w-4 h-4 mr-1" />
                                            Send Out
                                          </Button>
                                        )}
                                      {survey.status === "active" &&
                                        !isSurveyLocked(survey) && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              void handleRecall(survey.id)
                                            }
                                            title="Stop accepting responses (sets back to draft)"
                                          >
                                            Recall
                                          </Button>
                                        )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="Preview as respondent"
                                        onClick={() => setPreviewSurvey(survey)}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title={
                                          isSurveyLocked(survey)
                                            ? "Survey ended — cannot edit"
                                            : "Edit survey"
                                        }
                                        onClick={() => openEditSurvey(survey)}
                                        disabled={isSurveyLocked(survey)}
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        title="View results"
                                        onClick={() =>
                                          openResultsForSurvey(survey.id)
                                        }
                                      >
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
                    <div className="text-center py-12">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        HR-only view
                      </h3>
                      <p className="text-sm text-gray-500">
                        Survey creation and management is restricted to HR
                        personnel.
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="results" className="space-y-6 mt-0">
                  {!isHRUser ? (
                    <div className="text-center py-12">
                      <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        HR-only view
                      </h3>
                      <p className="text-sm text-gray-500">
                        Survey analytics are restricted to HR personnel.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900">
                          Survey Results Dashboard
                        </h3>
                      </div>

                      {/* Survey selector */}
                      <div>
                        <Label className="text-sm font-medium text-gray-700">
                          Survey
                        </Label>
                        <Select
                          value={
                            analyticsSurveyId !== null
                              ? String(analyticsSurveyId)
                              : ""
                          }
                          onValueChange={(v) =>
                            setAnalyticsSurveyId(v ? Number(v) : null)
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select a survey..." />
                          </SelectTrigger>
                          <SelectContent>
                            {surveys.map((s) => (
                              <SelectItem key={s.id} value={String(s.id)}>
                                {s.title}
                                {s.anonymous ? " (anonymous)" : ""}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {analyticsSurveyId === null ? (
                        <div className="text-center py-12">
                          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-sm text-gray-500">
                            Pick a survey to view aggregated results.
                          </p>
                        </div>
                      ) : analyticsLoading ? (
                        <div className="text-center py-12 text-sm text-gray-500">
                          Loading analytics...
                        </div>
                      ) : analyticsError ? (
                        <div className="text-center py-12">
                          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                          <p className="text-sm text-red-700">
                            {analyticsError}
                          </p>
                        </div>
                      ) : !analytics ? null : (
                        <>
                          {/* Headline metrics */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-blue-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-blue-900">
                                Total Responses
                              </p>
                              <p className="text-2xl font-bold text-blue-700">
                                {analytics.total_responses}
                              </p>
                              {analytics.is_anonymous && (
                                <p className="text-xs text-blue-600 mt-1">
                                  Anonymous survey
                                </p>
                              )}
                            </div>
                            <div className="bg-green-50 rounded-lg p-4">
                              <p className="text-sm font-medium text-green-900">
                                Questions
                              </p>
                              <p className="text-2xl font-bold text-green-700">
                                {analytics.questions.length}
                              </p>
                            </div>
                          </div>

                          {/* Per-question charts */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {analytics.questions.map((q) => (
                              <div
                                key={q.question_id}
                                className="border border-gray-200 rounded-lg p-4 bg-white"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <div>
                                    <Badge variant="outline" className="mb-2">
                                      {q.type}
                                    </Badge>
                                    <h4 className="font-medium text-gray-900">
                                      {q.text}
                                    </h4>
                                  </div>
                                  <div className="text-right text-xs text-gray-500">
                                    <p>{q.response_count} responses</p>
                                    {q.type === "scale" &&
                                      q.average !== undefined && (
                                        <p className="font-bold text-base text-gray-900 mt-1">
                                          avg {q.average.toFixed(2)}
                                        </p>
                                      )}
                                  </div>
                                </div>

                                {q.type === "choice" && q.distribution && (
                                  <div className="h-56">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <PieChart>
                                        <Pie
                                          data={q.distribution}
                                          dataKey="count"
                                          nameKey="value"
                                          cx="50%"
                                          cy="50%"
                                          outerRadius={70}
                                          label={({ value, count }) =>
                                            `${value}: ${count}`
                                          }
                                        >
                                          {q.distribution.map((_, i) => (
                                            <Cell
                                              key={i}
                                              fill={
                                                [
                                                  "#3b82f6",
                                                  "#10b981",
                                                  "#f59e0b",
                                                  "#ef4444",
                                                  "#8b5cf6",
                                                  "#ec4899",
                                                ][i % 6]
                                              }
                                            />
                                          ))}
                                        </Pie>
                                        <Tooltip />
                                      </PieChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}

                                {q.type === "scale" && q.distribution && (
                                  <div className="h-56">
                                    <ResponsiveContainer
                                      width="100%"
                                      height="100%"
                                    >
                                      <BarChart data={q.distribution}>
                                        <CartesianGrid
                                          strokeDasharray="3 3"
                                          opacity={0.3}
                                        />
                                        <XAxis dataKey="value" />
                                        <YAxis allowDecimals={false} />
                                        <Tooltip />
                                        <Bar
                                          dataKey="count"
                                          fill="#3b82f6"
                                          radius={[4, 4, 0, 0]}
                                        />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                )}

                                {q.type === "text" && (
                                  <div className="space-y-2 max-h-56 overflow-y-auto">
                                    {(q.samples ?? []).length === 0 ? (
                                      <p className="text-sm text-gray-500 italic">
                                        No text responses yet.
                                      </p>
                                    ) : (
                                      (q.samples ?? []).map((s, i) => (
                                        <div
                                          key={i}
                                          className="text-sm bg-gray-50 rounded p-2 border border-gray-100"
                                        >
                                          {s}
                                        </div>
                                      ))
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Trend over time */}
                          <div className="border border-gray-200 rounded-lg p-4 bg-white">
                            <h4 className="font-medium text-gray-900 mb-4">
                              Responses Over Time
                            </h4>
                            <div className="h-64">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={analytics.responses_over_time}>
                                  <CartesianGrid
                                    strokeDasharray="3 3"
                                    opacity={0.3}
                                  />
                                  <XAxis dataKey="date" />
                                  <YAxis allowDecimals={false} />
                                  <Tooltip />
                                  <Line
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                  />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="suggestions" className="space-y-6 mt-0">
                  <div className="space-y-6">
                    <h3 className="font-medium text-gray-900">
                      Suggestion Box
                    </h3>

                    {/* Submit Suggestion Form */}
                    <Card className="border-gray-200">
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
                            variant="primary"
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
                        <h4 className="font-medium text-gray-900">
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
                              className="border-gray-200"
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <CategoryIcon className="w-4 h-4 text-gray-500" />
                                      <h4 className="font-medium text-gray-900">
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
                                    <p className="text-sm text-gray-600 mb-3">
                                      {suggestion.description}
                                    </p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
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
      </div>

      {/* Preview Dialog */}
      <Dialog
        open={previewSurvey !== null}
        onOpenChange={(open) => !open && setPreviewSurvey(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {previewSurvey?.title ?? "Survey Preview"}
            </DialogTitle>
            <DialogDescription>
              Read-only preview of how respondents will see this survey.
            </DialogDescription>
          </DialogHeader>
          {previewSurvey && (
            <div className="space-y-4 pt-2">
              {previewSurvey.description && (
                <p className="text-sm text-gray-600">
                  {previewSurvey.description}
                </p>
              )}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{previewSurvey.status}</Badge>
                <Badge variant="outline">
                  {previewSurvey.anonymous ? "Anonymous" : "Not Anonymous"}
                </Badge>
                {previewSurvey.createdByName && (
                  <Badge variant="outline">
                    by {previewSurvey.createdByName}
                  </Badge>
                )}
                {previewSurvey.endDate && (
                  <Badge variant="outline">ends {previewSurvey.endDate}</Badge>
                )}
              </div>
              <div className="space-y-3 pt-2">
                {previewSurvey.questions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    This survey has no questions yet.
                  </p>
                ) : (
                  previewSurvey.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className="p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {q.question}
                        </p>
                        <Badge variant="outline" className="text-xs">
                          {q.type}
                        </Badge>
                      </div>
                      {q.type === "multiple_choice" && q.options && (
                        <ul className="mt-2 ml-4 list-disc text-sm text-gray-600">
                          {q.options.map((opt, i) => (
                            <li key={i}>{opt}</li>
                          ))}
                        </ul>
                      )}
                      {q.type === "rating" && (
                        <p className="mt-2 text-sm text-gray-500">Scale 1–5</p>
                      )}
                      {q.type === "yes_no" && (
                        <p className="mt-2 text-sm text-gray-500">Yes / No</p>
                      )}
                      {q.type === "text" && (
                        <p className="mt-2 text-sm text-gray-500">
                          Free-text answer
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editingSurvey !== null}
        onOpenChange={(open) => {
          if (!open && !savingEdit) setEditingSurvey(null);
        }}
      >
        <DialogContent className="max-w-3xl max-h-[88vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Survey</DialogTitle>
            <DialogDescription>
              Update settings, edit existing questions, or add and remove
              questions.
            </DialogDescription>
          </DialogHeader>
          {editingSurvey && (
            <div className="space-y-4 pt-2">
              <div className="space-y-1">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editDraft.title}
                  onChange={(e) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="edit-desc">Description</Label>
                <Textarea
                  id="edit-desc"
                  rows={2}
                  value={editDraft.description}
                  onChange={(e) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select
                    value={editDraft.status}
                    onValueChange={(v) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        status: v as SurveyStatus,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">draft</SelectItem>
                      <SelectItem value="active">active</SelectItem>
                      <SelectItem value="closed">closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="edit-end">End date</Label>
                  <Input
                    id="edit-end"
                    type="date"
                    value={editDraft.endDate}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        endDate: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="edit-anon"
                  checked={editDraft.anonymous}
                  onCheckedChange={(checked) =>
                    setEditDraft((prev) => ({
                      ...prev,
                      anonymous: checked,
                    }))
                  }
                />
                <Label htmlFor="edit-anon">Anonymous</Label>
              </div>

              {/* Forbid specific users */}
              <div className="space-y-2 pt-2 border-t border-gray-100">
                <Label className="text-sm">Forbid users (optional)</Label>
                <p className="text-xs text-gray-500">
                  Selected users will not see or be able to take this survey.
                </p>
                <div className="border border-gray-200 rounded p-2 max-h-32 overflow-y-auto space-y-1">
                  {orgUsers.length === 0 ? (
                    <p className="text-xs text-gray-500 italic">
                      No users loaded.
                    </p>
                  ) : (
                    orgUsers.map((u) => {
                      const checked = editDraft.forbiddenUserIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className="flex items-center gap-2 text-sm cursor-pointer"
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(v) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                forbiddenUserIds: v
                                  ? [...prev.forbiddenUserIds, u.id]
                                  : prev.forbiddenUserIds.filter(
                                      (id) => id !== u.id
                                    ),
                              }))
                            }
                          />
                          <span>{u.name}</span>
                        </label>
                      );
                    })
                  )}
                </div>
                {editDraft.forbiddenUserIds.length > 0 && (
                  <p className="text-xs text-amber-700">
                    {editDraft.forbiddenUserIds.length} user(s) forbidden.
                  </p>
                )}
              </div>

              {/* Question editor */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Questions</h4>
                  <span className="text-xs text-gray-500">
                    {editDraft.questions.length} total
                  </span>
                </div>

                {editDraft.questions.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">
                    No questions yet. Add one below.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {editDraft.questions.map((q, idx) => (
                      <div
                        key={q.id}
                        className="p-3 border border-gray-200 rounded-lg space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <Select
                            value={q.type}
                            onValueChange={(v) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                questions: prev.questions.map((qq, i) => {
                                  if (i !== idx) return qq;
                                  const newType = v as QuestionType;
                                  return {
                                    ...qq,
                                    type: newType,
                                    options:
                                      newType === "multiple_choice"
                                        ? qq.options && qq.options.length > 0
                                          ? qq.options
                                          : ["", ""]
                                        : undefined,
                                  };
                                }),
                              }))
                            }
                          >
                            <SelectTrigger className="w-44 h-8 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="rating">
                                Rating (1–5)
                              </SelectItem>
                              <SelectItem value="multiple_choice">
                                Multiple choice
                              </SelectItem>
                              <SelectItem value="yes_no">Yes / No</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditDraft((prev) => ({
                                ...prev,
                                questions: prev.questions.filter(
                                  (_, i) => i !== idx
                                ),
                              }))
                            }
                            title="Remove question"
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                        <Input
                          value={q.question}
                          onChange={(e) =>
                            setEditDraft((prev) => ({
                              ...prev,
                              questions: prev.questions.map((qq, i) =>
                                i === idx
                                  ? { ...qq, question: e.target.value }
                                  : qq
                              ),
                            }))
                          }
                          placeholder="Question text"
                        />
                        {q.type === "multiple_choice" && (
                          <div className="space-y-2">
                            <Label className="text-xs text-gray-500">
                              Options
                            </Label>
                            {(q.options ?? []).map((opt, optIdx) => (
                              <div
                                key={optIdx}
                                className="flex items-center gap-2"
                              >
                                <Input
                                  value={opt}
                                  onChange={(e) =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      questions: prev.questions.map((qq, i) =>
                                        i === idx
                                          ? {
                                              ...qq,
                                              options: (qq.options ?? []).map(
                                                (o, j) =>
                                                  j === optIdx
                                                    ? e.target.value
                                                    : o
                                              ),
                                            }
                                          : qq
                                      ),
                                    }))
                                  }
                                  placeholder={`Option ${optIdx + 1}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setEditDraft((prev) => ({
                                      ...prev,
                                      questions: prev.questions.map((qq, i) =>
                                        i === idx
                                          ? {
                                              ...qq,
                                              options: (
                                                qq.options ?? []
                                              ).filter((_, j) => j !== optIdx),
                                            }
                                          : qq
                                      ),
                                    }))
                                  }
                                  disabled={(q.options ?? []).length <= 1}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setEditDraft((prev) => ({
                                  ...prev,
                                  questions: prev.questions.map((qq, i) =>
                                    i === idx
                                      ? {
                                          ...qq,
                                          options: [...(qq.options ?? []), ""],
                                        }
                                      : qq
                                  ),
                                }))
                              }
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Add option
                            </Button>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Switch
                            id={`req-${q.id}-${idx}`}
                            checked={q.required}
                            onCheckedChange={(checked) =>
                              setEditDraft((prev) => ({
                                ...prev,
                                questions: prev.questions.map((qq, i) =>
                                  i === idx ? { ...qq, required: checked } : qq
                                ),
                              }))
                            }
                          />
                          <Label
                            htmlFor={`req-${q.id}-${idx}`}
                            className="text-sm"
                          >
                            Required
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new question form */}
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    Add a question
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <Select
                      value={editNewQuestion.type}
                      onValueChange={(v) =>
                        setEditNewQuestion((prev) => ({
                          ...prev,
                          type: v as QuestionType,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Text</SelectItem>
                        <SelectItem value="rating">Rating (1–5)</SelectItem>
                        <SelectItem value="multiple_choice">
                          Multiple choice
                        </SelectItem>
                        <SelectItem value="yes_no">Yes / No</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Question text"
                        value={editNewQuestion.question}
                        onChange={(e) =>
                          setEditNewQuestion((prev) => ({
                            ...prev,
                            question: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                  {editNewQuestion.type === "multiple_choice" && (
                    <div className="space-y-1">
                      {editNewQuestion.options.map((opt, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            placeholder={`Option ${i + 1}`}
                            value={opt}
                            onChange={(e) =>
                              setEditNewQuestion((prev) => ({
                                ...prev,
                                options: prev.options.map((o, j) =>
                                  j === i ? e.target.value : o
                                ),
                              }))
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setEditNewQuestion((prev) => ({
                                ...prev,
                                options: prev.options.filter((_, j) => j !== i),
                              }))
                            }
                            disabled={editNewQuestion.options.length <= 1}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEditNewQuestion((prev) => ({
                            ...prev,
                            options: [...prev.options, ""],
                          }))
                        }
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Add option
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="edit-new-required"
                        checked={editNewQuestion.required}
                        onCheckedChange={(checked) =>
                          setEditNewQuestion((prev) => ({
                            ...prev,
                            required: checked,
                          }))
                        }
                      />
                      <Label htmlFor="edit-new-required" className="text-sm">
                        Required
                      </Label>
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => {
                        if (!editNewQuestion.question.trim()) return;
                        if (
                          editNewQuestion.type === "multiple_choice" &&
                          editNewQuestion.options.filter((o) => o.trim())
                            .length < 2
                        )
                          return;
                        const newQ: Question = {
                          id: Date.now(),
                          type: editNewQuestion.type,
                          question: editNewQuestion.question,
                          options:
                            editNewQuestion.type === "multiple_choice"
                              ? editNewQuestion.options.filter((o) => o.trim())
                              : undefined,
                          required: editNewQuestion.required,
                        };
                        setEditDraft((prev) => ({
                          ...prev,
                          questions: [...prev.questions, newQ],
                        }));
                        setEditNewQuestion({
                          type: "text",
                          question: "",
                          options: [""],
                          required: true,
                        });
                      }}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => setEditingSurvey(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleSaveEdit()}
                  disabled={savingEdit}
                >
                  {savingEdit ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Take-Survey Dialog */}
      <Dialog
        open={takingSurvey !== null}
        onOpenChange={(open) => {
          if (!open && !submittingResponse) {
            setTakingSurvey(null);
            setTakeDraft({});
            setSubmitError(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{takingSurvey?.title ?? "Survey"}</DialogTitle>
            {takingSurvey?.description && (
              <DialogDescription>{takingSurvey.description}</DialogDescription>
            )}
          </DialogHeader>

          {takingSurvey && (
            <div className="space-y-6 pt-2">
              {takingSurvey.anonymous ? (
                <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                  <Lock className="w-4 h-4 text-blue-700" />
                  <p className="text-sm text-blue-900">
                    This survey is anonymous — your identity will not be saved.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-100 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-amber-700" />
                  <p className="text-sm text-amber-900">
                    Submitting again will replace any previous answers you gave
                    for this survey.
                  </p>
                </div>
              )}

              {takingSurvey.questions.map((q) => (
                <div key={q.id} className="space-y-2">
                  <Label className="text-sm font-medium text-gray-900">
                    {q.question}
                  </Label>

                  {q.type === "text" && (
                    <Textarea
                      rows={3}
                      placeholder="Type your answer..."
                      value={takeDraft[q.id] ?? ""}
                      onChange={(e) =>
                        setTakeDraft((prev) => ({
                          ...prev,
                          [q.id]: e.target.value,
                        }))
                      }
                    />
                  )}

                  {q.type === "multiple_choice" && (
                    <RadioGroup
                      value={takeDraft[q.id] ?? ""}
                      onValueChange={(value) =>
                        setTakeDraft((prev) => ({
                          ...prev,
                          [q.id]: value,
                        }))
                      }
                    >
                      {(q.options ?? []).map((opt, idx) => (
                        <div
                          key={`${q.id}-${idx}`}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem
                            value={opt}
                            id={`q${q.id}-opt${idx}`}
                          />
                          <Label
                            htmlFor={`q${q.id}-opt${idx}`}
                            className="cursor-pointer font-normal"
                          >
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.type === "yes_no" && (
                    <RadioGroup
                      value={takeDraft[q.id] ?? ""}
                      onValueChange={(value) =>
                        setTakeDraft((prev) => ({
                          ...prev,
                          [q.id]: value,
                        }))
                      }
                    >
                      {["Yes", "No"].map((opt) => (
                        <div
                          key={`${q.id}-${opt}`}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem value={opt} id={`q${q.id}-${opt}`} />
                          <Label
                            htmlFor={`q${q.id}-${opt}`}
                            className="cursor-pointer font-normal"
                          >
                            {opt}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}

                  {q.type === "rating" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((n) => {
                        const selected = takeDraft[q.id] === String(n);
                        return (
                          <Button
                            key={n}
                            type="button"
                            variant={selected ? "primary" : "outline"}
                            size="sm"
                            onClick={() =>
                              setTakeDraft((prev) => ({
                                ...prev,
                                [q.id]: String(n),
                              }))
                            }
                            className="w-12"
                          >
                            {n}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}

              {submitError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                  <p className="text-sm text-red-700">{submitError}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <Button
                  variant="outline"
                  onClick={() => {
                    setTakingSurvey(null);
                    setTakeDraft({});
                    setSubmitError(null);
                  }}
                  disabled={submittingResponse}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={() => void handleSubmitResponse()}
                  disabled={submittingResponse}
                >
                  <Send className="w-4 h-4 mr-2" />
                  {submittingResponse ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
