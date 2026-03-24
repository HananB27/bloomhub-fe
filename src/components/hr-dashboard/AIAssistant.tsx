import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  Bot,
  Send,
  Sparkles,
  Calendar,
  Users,
  Star,
  UserPlus,
  GraduationCap,
  DollarSign,
  MessageSquare,
  Clock,
  MapPin,
  FileText,
  Package,
  Network,
  BarChart3,
  Megaphone,
  Lightbulb,
  InfoIcon,
} from "lucide-react";
import type { HrModuleId } from "./hr-modules";

interface ChatMessage {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  module?: HrModuleId;
  suggestions?: string[];
}

interface AIAssistantProps {
  activeModule: HrModuleId;
  onModuleNavigate: (moduleId: HrModuleId) => void;
}

const hrModuleCapabilities: Record<
  HrModuleId,
  {
    icon: typeof BarChart3;
    capabilities: string[];
  }
> = {
  dashboard: {
    icon: BarChart3,
    capabilities: [
      "View HR metrics",
      "Generate reports",
      "Track KPIs",
      "Monitor trends",
    ],
  },
  vacations: {
    icon: Calendar,
    capabilities: [
      "Approve leave requests",
      "Check vacation balances",
      "Schedule time off",
      "View team calendars",
    ],
  },
  profiles: {
    icon: Users,
    capabilities: [
      "Update employee info",
      "Manage roles",
      "Track skills",
      "View org structure",
    ],
  },
  reviews: {
    icon: Star,
    capabilities: [
      "Schedule reviews",
      "Track performance",
      "Set goals",
      "Generate feedback",
    ],
  },
  onboarding: {
    icon: UserPlus,
    capabilities: [
      "Create onboarding plans",
      "Track progress",
      "Assign tasks",
      "Welcome new hires",
    ],
  },
  training: {
    icon: GraduationCap,
    capabilities: [
      "Assign courses",
      "Track completion",
      "Schedule training",
      "Skills development",
    ],
  },
  compensation: {
    icon: DollarSign,
    capabilities: [
      "Manage salaries",
      "Process bonuses",
      "Benefits administration",
      "Equity management",
    ],
  },
  feedback: {
    icon: MessageSquare,
    capabilities: [
      "Create surveys",
      "Collect feedback",
      "Analyze responses",
      "Action planning",
    ],
  },
  timetracking: {
    icon: Clock,
    capabilities: [
      "Track hours",
      "Approve timesheets",
      "Monitor attendance",
      "Overtime management",
    ],
  },
  mobility: {
    icon: MapPin,
    capabilities: [
      "Job postings",
      "Internal transfers",
      "Career paths",
      "Skill matching",
    ],
  },
  documents: {
    icon: FileText,
    capabilities: [
      "Store documents",
      "Version control",
      "Access management",
      "Digital signatures",
    ],
  },
  assets: {
    icon: Package,
    capabilities: [
      "Track equipment",
      "Assign assets",
      "Maintenance schedules",
      "Inventory management",
    ],
  },
  orgchart: {
    icon: Network,
    capabilities: [
      "Visualize structure",
      "Reporting lines",
      "Team hierarchies",
      "Org changes",
    ],
  },
  analytics: {
    icon: BarChart3,
    capabilities: [
      "HR metrics",
      "Predictive analytics",
      "Trend analysis",
      "Custom reports",
    ],
  },
  announcements: {
    icon: Megaphone,
    capabilities: [
      "Company updates",
      "Policy changes",
      "Event notifications",
      "Targeted messaging",
    ],
  },
};

export function AIAssistant({
  activeModule,
  onModuleNavigate,
}: AIAssistantProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      type: "assistant",
      content:
        "Hi! I'm your AI HR Assistant. I can help you with all aspects of HR management across our 15 modules. What would you like to work on today?",
      timestamp: new Date(),
      suggestions: [
        "Show pending vacation requests",
        "Help me onboard a new employee",
        "Generate performance review reports",
        "Check team training progress",
      ],
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  const createMessageId = () => {
    idCounterRef.current += 1;
    return idCounterRef.current.toString();
  };

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is rendered
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isOpen, isTyping]);

  const generateAIResponse = (userMessage: string): ChatMessage => {
    const lowerMessage = userMessage.toLowerCase();
    let responseContent = "";
    let relatedModule: HrModuleId | undefined = undefined;
    let suggestions: string[] = [];

    // Vacation/Leave related
    if (
      lowerMessage.includes("vacation") ||
      lowerMessage.includes("leave") ||
      lowerMessage.includes("time off")
    ) {
      relatedModule = "vacations";
      responseContent =
        "I can help you with vacation management! I can show pending requests, check balances, approve time off, or help you plan team coverage. What specific vacation task would you like to handle?";
      suggestions = [
        "Show pending requests",
        "Check team vacation calendar",
        "Approve all pending requests",
        "View vacation balances",
      ];
    }
    // Employee/Profile related
    else if (
      lowerMessage.includes("employee") ||
      lowerMessage.includes("profile") ||
      lowerMessage.includes("staff")
    ) {
      relatedModule = "profiles";
      responseContent =
        "I can assist with employee profile management! I can help you update information, manage roles, track skills, or view team structures. What employee information do you need to work with?";
      suggestions = [
        "Update employee info",
        "Add new employee",
        "Manage team roles",
        "View org structure",
      ];
    }
    // Performance/Review related
    else if (
      lowerMessage.includes("performance") ||
      lowerMessage.includes("review") ||
      lowerMessage.includes("evaluation")
    ) {
      relatedModule = "reviews";
      responseContent =
        "I can help with performance management! I can schedule reviews, track progress, set goals, or generate performance reports. What would you like to focus on?";
      suggestions = [
        "Schedule upcoming reviews",
        "View performance metrics",
        "Generate review reports",
        "Set team goals",
      ];
    }
    // Onboarding related
    else if (
      lowerMessage.includes("onboard") ||
      lowerMessage.includes("new hire") ||
      lowerMessage.includes("welcome")
    ) {
      relatedModule = "onboarding";
      responseContent =
        "I can assist with onboarding new employees! I can create onboarding plans, track progress, assign tasks, or help prepare welcome materials. How can I help with onboarding?";
      suggestions = [
        "Create onboarding plan",
        "Track new hire progress",
        "Assign onboarding tasks",
        "View completion status",
      ];
    }
    // Training related
    else if (
      lowerMessage.includes("training") ||
      lowerMessage.includes("course") ||
      lowerMessage.includes("learning")
    ) {
      relatedModule = "training";
      responseContent =
        "I can help with training and development! I can assign courses, track completion, schedule sessions, or recommend skill development paths. What training needs do you have?";
      suggestions = [
        "Assign training courses",
        "Track completion rates",
        "Schedule training sessions",
        "View skill gaps",
      ];
    }
    // Compensation related
    else if (
      lowerMessage.includes("salary") ||
      lowerMessage.includes("compensation") ||
      lowerMessage.includes("pay") ||
      lowerMessage.includes("bonus")
    ) {
      relatedModule = "compensation";
      responseContent =
        "I can assist with compensation management! I can help with salary reviews, bonus processing, benefits administration, or equity management. What compensation task can I help with?";
      suggestions = [
        "Process salary reviews",
        "Calculate bonuses",
        "Manage benefits",
        "Review compensation bands",
      ];
    }
    // Feedback/Survey related
    else if (
      lowerMessage.includes("feedback") ||
      lowerMessage.includes("survey") ||
      lowerMessage.includes("opinion")
    ) {
      relatedModule = "feedback";
      responseContent =
        "I can help with feedback and surveys! I can create surveys, collect responses, analyze feedback, or help with action planning. What feedback initiative would you like to work on?";
      suggestions = [
        "Create employee survey",
        "Analyze feedback results",
        "Generate feedback reports",
        "Plan improvement actions",
      ];
    }
    // Time tracking related
    else if (
      lowerMessage.includes("time") ||
      lowerMessage.includes("hours") ||
      lowerMessage.includes("timesheet") ||
      lowerMessage.includes("attendance")
    ) {
      relatedModule = "timetracking";
      responseContent =
        "I can assist with time tracking! I can help approve timesheets, monitor attendance, track hours, or manage overtime. What time tracking task do you need help with?";
      suggestions = [
        "Approve pending timesheets",
        "View attendance reports",
        "Track overtime hours",
        "Monitor team hours",
      ];
    }
    // Mobility/Career related
    else if (
      lowerMessage.includes("mobility") ||
      lowerMessage.includes("career") ||
      lowerMessage.includes("promotion") ||
      lowerMessage.includes("transfer")
    ) {
      relatedModule = "mobility";
      responseContent =
        "I can help with internal mobility! I can assist with job postings, internal transfers, career planning, or skill matching. What mobility opportunity are you working on?";
      suggestions = [
        "Create job posting",
        "Review transfer requests",
        "Plan career paths",
        "Match skills to roles",
      ];
    }
    // Documents related
    else if (
      lowerMessage.includes("document") ||
      lowerMessage.includes("file") ||
      lowerMessage.includes("contract") ||
      lowerMessage.includes("policy")
    ) {
      relatedModule = "documents";
      responseContent =
        "I can assist with document management! I can help organize files, manage access, track versions, or handle digital signatures. What document task can I help with?";
      suggestions = [
        "Upload new documents",
        "Manage access permissions",
        "Track document versions",
        "Request digital signatures",
      ];
    }
    // Assets related
    else if (
      lowerMessage.includes("asset") ||
      lowerMessage.includes("equipment") ||
      lowerMessage.includes("laptop") ||
      lowerMessage.includes("inventory")
    ) {
      relatedModule = "assets";
      responseContent =
        "I can help with asset management! I can track equipment, assign assets to employees, schedule maintenance, or manage inventory. What asset management task do you need help with?";
      suggestions = [
        "Assign equipment",
        "Track asset locations",
        "Schedule maintenance",
        "View inventory status",
      ];
    }
    // Org chart related
    else if (
      lowerMessage.includes("org") ||
      lowerMessage.includes("organization") ||
      lowerMessage.includes("hierarchy") ||
      lowerMessage.includes("reporting")
    ) {
      relatedModule = "orgchart";
      responseContent =
        "I can assist with organizational structure! I can help visualize the org chart, manage reporting lines, update team hierarchies, or plan organizational changes. What org structure task can I help with?";
      suggestions = [
        "Update org chart",
        "View team structure",
        "Manage reporting lines",
        "Plan org changes",
      ];
    }
    // Analytics related
    else if (
      lowerMessage.includes("analytics") ||
      lowerMessage.includes("report") ||
      lowerMessage.includes("data") ||
      lowerMessage.includes("metrics")
    ) {
      relatedModule = "analytics";
      responseContent =
        "I can help with HR analytics! I can generate reports, analyze trends, create dashboards, or provide insights. What analytics or reporting do you need?";
      suggestions = [
        "Generate HR reports",
        "Analyze employee trends",
        "Create custom dashboards",
        "View key metrics",
      ];
    }
    // Announcements related
    else if (
      lowerMessage.includes("announcement") ||
      lowerMessage.includes("communicate") ||
      lowerMessage.includes("message") ||
      lowerMessage.includes("notify")
    ) {
      relatedModule = "announcements";
      responseContent =
        "I can assist with company announcements! I can help create messages, target specific groups, schedule communications, or track engagement. What announcement do you need to make?";
      suggestions = [
        "Create company announcement",
        "Send team update",
        "Schedule communication",
        "View announcement analytics",
      ];
    }
    // General help
    else if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("what can you do")
    ) {
      responseContent =
        "I'm your comprehensive HR AI assistant! I can help you with all 15 HR modules:\n\n• Dashboard & Analytics\n• Vacation Management\n• Employee Profiles\n• Performance Reviews\n• Onboarding\n• Training & Development\n• Compensation\n• Feedback & Surveys\n• Time Tracking\n• Internal Mobility\n• Document Management\n• Asset Management\n• Org Chart\n• HR Analytics\n• Announcements\n\nJust tell me what you'd like to work on!";
      suggestions = [
        "Show me pending tasks",
        "Generate monthly HR report",
        "Help with employee onboarding",
        "Check team performance",
      ];
    }
    // Default response
    else {
      responseContent = `I understand you're asking about "${userMessage}". I can help you with any HR task across our platform! Whether it's managing employees, processing requests, generating reports, or planning initiatives - I'm here to assist. Which specific area would you like to focus on?`;
      const targetModule: HrModuleId = hrModuleCapabilities[activeModule]
        ? activeModule
        : "dashboard";
      relatedModule = targetModule;
      suggestions = [
        `Navigate to ${targetModule} module`,
        "Show me what I can do",
        "Help with urgent tasks",
        "Generate summary report",
      ];
    }

    return {
      id: createMessageId(),
      type: "assistant",
      content: responseContent,
      timestamp: new Date(),
      module: relatedModule,
      suggestions,
    };
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = generateAIResponse(inputValue);
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
    }, 1200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInputValue(suggestion);
    setTimeout(() => handleSendMessage(), 100);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleModuleNavigation = (moduleId: HrModuleId) => {
    onModuleNavigate(moduleId);
    setIsOpen(false);
    const message: ChatMessage = {
      id: createMessageId(),
      type: "assistant",
      content: `Great! I've navigated you to the ${hrModuleCapabilities[moduleId] ? moduleId : "dashboard"} module. Feel free to ask me for help with any tasks there!`,
      timestamp: new Date(),
      module: moduleId,
    };
    setMessages((prev) => [...prev, message]);
  };

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 h-9 w-9 transition-colors rounded-lg"
      >
        <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 h-9 w-9 transition-colors rounded-lg"
        >
          <Bot className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-linear-to-r from-gray-700 to-gray-800 rounded-full flex items-center justify-center">
            <Sparkles className="w-2 h-2 text-white shrink-0" />
          </div>
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl w-full h-[85vh] max-h-[700px] p-0 gap-0 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
        <DialogHeader className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-linear-to-r from-gray-50 to-gray-100 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <div className="w-10 h-10 bg-linear-to-r from-gray-700 to-gray-800 rounded-xl flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-gray-900 dark:text-gray-100">
                AI HR Assistant
              </span>
              <div className="flex items-center gap-2 mt-1">
                <Sparkles className="w-4 h-4 text-gray-500 dark:text-gray-400 shrink-0" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Powered by Bloomteq AI
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3 ml-auto">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Online
                </span>
              </div>
            </div>
          </DialogTitle>

          {/* Current Module Banner */}
          {hrModuleCapabilities[
            activeModule as keyof typeof hrModuleCapabilities
          ] && (
            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon =
                    hrModuleCapabilities[
                      activeModule as keyof typeof hrModuleCapabilities
                    ].icon;
                  return (
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                  );
                })()}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Currently in: {activeModule}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    I can help you with tasks specific to this module
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleSuggestionClick(`Help me with ${activeModule}`)
                  }
                  className="text-xs"
                >
                  Get Help
                </Button>
              </div>
            </div>
          )}
        </DialogHeader>

        {/* Chat Content - Fixed Height Container */}
        <div className="flex flex-col flex-1 min-h-0">
          {/* Messages Area with Proper Scrolling */}
          <div className="flex-1 min-h-0 relative">
            <ScrollArea ref={scrollAreaRef} className="h-full w-full">
              <div className="px-6 py-4">
                <div className="space-y-6 pb-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[75%] ${message.type === "user" ? "order-1" : "order-2"}`}
                      >
                        <div
                          className={`
                          px-4 py-3 rounded-xl text-sm leading-relaxed
                          ${
                            message.type === "user"
                              ? "bg-gray-900 text-white rounded-br-sm shadow-sm"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-700"
                          }
                        `}
                        >
                          <div className="whitespace-pre-wrap">
                            {message.content}
                          </div>

                          {message.module && (
                            <div className="mt-3 pt-3 border-t border-gray-300/30">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleModuleNavigation(message.module!)
                                }
                                className="text-xs bg-white/10 border-white/20 text-gray-800 dark:text-gray-200 hover:bg-white/20"
                              >
                                Navigate to {message.module}
                              </Button>
                            </div>
                          )}
                        </div>

                        {message.suggestions &&
                          message.suggestions.length > 0 && (
                            <div className="mt-3 space-y-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 px-1">
                                Suggested actions:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {message.suggestions.map(
                                  (suggestion, index) => (
                                    <Button
                                      key={index}
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleSuggestionClick(suggestion)
                                      }
                                      className="text-xs rounded-full border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-900 hover:border-gray-400 transition-colors"
                                    >
                                      {suggestion}
                                    </Button>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 px-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl rounded-bl-sm max-w-[75%] border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          />
                          <div
                            className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invisible div for auto-scroll */}
                  <div ref={messagesEndRef} className="h-1" />
                </div>
              </div>
            </ScrollArea>
          </div>

          {/* Input Area - Fixed at Bottom */}
          <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 shrink-0">
            <div className="p-6">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                  onClick={() => handleSuggestionClick("Show pending tasks")}
                >
                  <Lightbulb className="w-3 h-3 mr-1" />
                  Pending Tasks
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                  onClick={() => handleSuggestionClick("Generate HR report")}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Generate Reports
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                  onClick={() =>
                    handleSuggestionClick("Help with employee onboarding")
                  }
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Onboarding Help
                </Badge>
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 transition-colors"
                  onClick={() =>
                    handleSuggestionClick("What can you help me with?")
                  }
                >
                  <InfoIcon className="w-3 h-3 mr-1" />
                  Show Capabilities
                </Badge>
              </div>

              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask me anything about HR management..."
                  className="flex-1 bg-white dark:bg-gray-800 border-gray-300 focus:border-gray-500 rounded-xl px-4 py-3 focus:ring-2 focus:ring-gray-200"
                  disabled={isTyping}
                />
                <Button
                  variant="primary"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="rounded-xl px-6 py-3 shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                AI Assistant can help with all 15 HR modules. Press Enter to
                send, Shift+Enter for new line.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
