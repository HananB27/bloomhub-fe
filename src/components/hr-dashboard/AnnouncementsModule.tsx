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
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Megaphone,
  Plus,
  Filter,
  Search,
  Pin,
  Heart,
  ThumbsUp,
  Smile,
  MessageCircle,
  Share,
  MoreHorizontal,
  Calendar,
  User,
  Gift,
  Star,
  Trophy,
  Coffee,
  Cake,
  PartyPopper,
  UserPlus,
  Users,
  Bell,
  Eye,
  Edit3,
  Trash2,
  Send,
  Image,
  Link,
  Clock,
  Building,
  Bookmark,
  Flag,
  TrendingUp,
  Activity,
  Settings,
  Archive,
  Volume2,
} from "lucide-react";

type PostType =
  | "announcement"
  | "birthday"
  | "new_hire"
  | "celebration"
  | "achievement"
  | "news"
  | "event"
  | "poll";
type PostPriority = "low" | "normal" | "high" | "urgent";

interface Post {
  id: number;
  type: PostType;
  priority: PostPriority;
  title: string;
  content: string;
  author: string;
  authorAvatar: string;
  authorRole: string;
  createdAt: string;
  updatedAt?: string;
  isPinned: boolean;
  isRead: boolean;
  department?: string;
  audience: "all" | "department" | "managers" | "specific";
  targetDepartment?: string;
  image?: string;
  link?: string;
  eventDate?: string;
  tags: string[];
  reactions: { [emoji: string]: { count: number; users: string[] } };
  comments: Comment[];
  isArchived: boolean;
}

interface Comment {
  id: number;
  postId: number;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  reactions: { [emoji: string]: { count: number; users: string[] } };
}

const emojiOptions = ["👍", "❤️", "😊", "🎉", "👏", "🔥", "💯", "😮"];

export function AnnouncementsModule() {
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isHRUser] = useState(true); // Mock HR permission
  const [showCommentsFor, setShowCommentsFor] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");

  // New post form state
  const [newPost, setNewPost] = useState({
    type: "announcement" as PostType,
    priority: "normal" as PostPriority,
    title: "",
    content: "",
    audience: "all",
    department: "",
    eventDate: "",
    tags: "",
  });

  // Mock posts data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 1,
      type: "announcement",
      priority: "high",
      title: "New Company Policy: Hybrid Work Guidelines",
      content:
        "We're excited to announce our new hybrid work policy that allows for greater flexibility while maintaining team collaboration. Effective Monday, all employees can work remotely up to 3 days per week with manager approval. Please review the full guidelines in the employee handbook.",
      author: "Sarah Johnson",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      authorRole: "HR Director",
      createdAt: "2025-08-07T09:00:00Z",
      isPinned: true,
      isRead: false,
      audience: "all",
      image:
        "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&h=400&fit=crop",
      tags: ["policy", "remote work", "important"],
      reactions: {
        "👍": { count: 24, users: ["alex-thompson", "michael-chen"] },
        "❤️": { count: 8, users: ["emily-rodriguez"] },
        "🎉": { count: 12, users: ["david-kim"] },
      },
      comments: [
        {
          id: 1,
          postId: 1,
          author: "Alex Thompson",
          authorAvatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          content:
            "This is fantastic! Really appreciate the flexibility. When will the manager approval process be finalized?",
          createdAt: "2025-08-07T10:30:00Z",
          reactions: {
            "👍": { count: 5, users: ["sarah-johnson", "michael-chen"] },
          },
        },
        {
          id: 2,
          postId: 1,
          author: "Michael Chen",
          authorAvatar:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
          content:
            "Great policy! This will really help with work-life balance.",
          createdAt: "2025-08-07T11:15:00Z",
          reactions: {},
        },
      ],
      isArchived: false,
    },
    {
      id: 2,
      type: "birthday",
      priority: "normal",
      title: "🎂 Happy Birthday Emily Rodriguez!",
      content:
        "Join us in wishing Emily from the Marketing team a very happy birthday! Emily has been an incredible asset to our team with her creative campaigns and positive energy. Hope you have a wonderful day, Emily! 🎉",
      author: "HR Team",
      authorAvatar:
        "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      authorRole: "System",
      createdAt: "2025-08-06T08:00:00Z",
      isPinned: true,
      isRead: true,
      audience: "all",
      department: "Marketing",
      image:
        "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=400&fit=crop",
      tags: ["birthday", "celebration", "marketing"],
      reactions: {
        "🎉": { count: 18, users: ["alex-thompson", "sarah-johnson"] },
        "❤️": { count: 12, users: ["michael-chen"] },
        "🎂": { count: 8, users: ["david-kim"] },
      },
      comments: [
        {
          id: 3,
          postId: 2,
          author: "Alex Thompson",
          authorAvatar:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
          content: "Happy birthday Emily! 🎉 Hope you have an amazing day!",
          createdAt: "2025-08-06T09:30:00Z",
          reactions: {
            "❤️": { count: 3, users: ["emily-rodriguez"] },
          },
        },
      ],
      isArchived: false,
    },
    {
      id: 3,
      type: "new_hire",
      priority: "normal",
      title: "Welcome Our New Software Engineer - Lisa Chen!",
      content:
        "We're thrilled to welcome Lisa Chen to our Engineering team! Lisa joins us with 5 years of experience in full-stack development and a passion for building scalable applications. She'll be working on our core platform features. Please join me in giving Lisa a warm welcome! 👋",
      author: "Alex Thompson",
      authorAvatar:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      authorRole: "Engineering Manager",
      createdAt: "2025-08-05T14:30:00Z",
      isPinned: false,
      isRead: true,
      audience: "all",
      department: "Engineering",
      image:
        "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=600&h=400&fit=crop",
      tags: ["new hire", "engineering", "welcome"],
      reactions: {
        "👋": { count: 15, users: ["sarah-johnson"] },
        "👍": { count: 20, users: ["michael-chen", "emily-rodriguez"] },
        "🎉": { count: 10, users: ["david-kim"] },
      },
      comments: [
        {
          id: 4,
          postId: 3,
          author: "Sarah Johnson",
          authorAvatar:
            "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
          content: "Welcome to the team Lisa! Excited to work with you.",
          createdAt: "2025-08-05T15:00:00Z",
          reactions: {},
        },
      ],
      isArchived: false,
    },
    {
      id: 4,
      type: "achievement",
      priority: "normal",
      title: "🏆 Q2 Sales Team Exceeded Targets by 150%!",
      content:
        "Incredible news! Our Sales team has exceeded their Q2 targets by 150%, marking our best quarter yet. Special recognition goes to Michael Chen for landing three major enterprise deals. This achievement reflects our team's dedication and hard work. Let's keep this momentum going! 🚀",
      author: "David Kim",
      authorAvatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
      authorRole: "Sales Director",
      createdAt: "2025-08-04T16:45:00Z",
      isPinned: false,
      isRead: true,
      audience: "all",
      department: "Sales",
      tags: ["achievement", "sales", "milestone"],
      reactions: {
        "🏆": { count: 25, users: ["sarah-johnson", "alex-thompson"] },
        "🎉": { count: 18, users: ["emily-rodriguez"] },
        "🚀": { count: 12, users: ["michael-chen"] },
      },
      comments: [],
      isArchived: false,
    },
    {
      id: 5,
      type: "event",
      priority: "normal",
      title: "📅 Company All-Hands Meeting - August 15th",
      content:
        "Save the date! Join us for our quarterly All-Hands meeting on Thursday, August 15th at 2:00 PM PST. We'll be sharing exciting updates about our product roadmap, new partnerships, and team achievements. Lunch will be provided for in-office attendees. Remote employees will receive catering vouchers.",
      author: "Sarah Johnson",
      authorAvatar:
        "https://images.unsplash.com/photo-1494790108755-2616b612b647?w=150&h=150&fit=crop&crop=face",
      authorRole: "HR Director",
      createdAt: "2025-08-03T11:00:00Z",
      isPinned: false,
      isRead: false,
      audience: "all",
      eventDate: "2025-08-15T14:00:00Z",
      tags: ["event", "all-hands", "important"],
      reactions: {
        "📅": {
          count: 30,
          users: ["alex-thompson", "michael-chen", "emily-rodriguez"],
        },
        "👍": { count: 22, users: ["david-kim"] },
      },
      comments: [
        {
          id: 5,
          postId: 5,
          author: "Emily Rodriguez",
          authorAvatar:
            "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
          content:
            "Will the recording be available for those who can't attend live?",
          createdAt: "2025-08-03T12:30:00Z",
          reactions: {
            "👍": { count: 8, users: ["alex-thompson"] },
          },
        },
      ],
      isArchived: false,
    },
  ]);

  const postTypes: {
    value: PostType;
    label: string;
    icon: any;
    color: string;
  }[] = [
    {
      value: "announcement",
      label: "Announcement",
      icon: Megaphone,
      color: "#2563eb",
    },
    { value: "birthday", label: "Birthday", icon: Cake, color: "#f59e0b" },
    { value: "new_hire", label: "New Hire", icon: UserPlus, color: "#10b981" },
    {
      value: "celebration",
      label: "Celebration",
      icon: PartyPopper,
      color: "#8b5cf6",
    },
    {
      value: "achievement",
      label: "Achievement",
      icon: Trophy,
      color: "#ef4444",
    },
    { value: "news", label: "Company News", icon: Volume2, color: "#06b6d4" },
    { value: "event", label: "Event", icon: Calendar, color: "#84cc16" },
    { value: "poll", label: "Poll", icon: TrendingUp, color: "#64748b" },
  ];

  const filteredPosts = posts.filter((post) => {
    if (post.isArchived) return false;

    const matchesSearch =
      post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || post.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const pinnedPosts = filteredPosts.filter((post) => post.isPinned);
  const regularPosts = filteredPosts.filter((post) => !post.isPinned);
  const unreadCount = posts.filter(
    (post) => !post.isRead && !post.isArchived
  ).length;

  const getPostTypeConfig = (type: PostType) => {
    return postTypes.find((pt) => pt.value === type) || postTypes[0];
  };

  const getPriorityColor = (priority: PostPriority) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "normal":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "low":
        return "bg-slate-100 text-slate-800 border-slate-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const addReaction = (
    postId: number,
    emoji: string,
    isComment = false,
    commentId?: number
  ) => {
    if (isComment && commentId) {
      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          comments: post.comments.map((comment) => {
            if (comment.id === commentId) {
              const reactions = { ...comment.reactions };
              const currentUser = "john-doe"; // Current user ID

              if (reactions[emoji]) {
                const userIndex = reactions[emoji].users.indexOf(currentUser);
                if (userIndex > -1) {
                  // Remove reaction
                  reactions[emoji].users.splice(userIndex, 1);
                  reactions[emoji].count = Math.max(
                    0,
                    reactions[emoji].count - 1
                  );
                  if (reactions[emoji].count === 0) {
                    delete reactions[emoji];
                  }
                } else {
                  // Add reaction
                  reactions[emoji].users.push(currentUser);
                  reactions[emoji].count++;
                }
              } else {
                // New reaction
                reactions[emoji] = { count: 1, users: [currentUser] };
              }

              return { ...comment, reactions };
            }
            return comment;
          }),
        }))
      );
    } else {
      setPosts((prev) =>
        prev.map((post) => {
          if (post.id === postId) {
            const reactions = { ...post.reactions };
            const currentUser = "john-doe"; // Current user ID

            if (reactions[emoji]) {
              const userIndex = reactions[emoji].users.indexOf(currentUser);
              if (userIndex > -1) {
                // Remove reaction
                reactions[emoji].users.splice(userIndex, 1);
                reactions[emoji].count = Math.max(
                  0,
                  reactions[emoji].count - 1
                );
                if (reactions[emoji].count === 0) {
                  delete reactions[emoji];
                }
              } else {
                // Add reaction
                reactions[emoji].users.push(currentUser);
                reactions[emoji].count++;
              }
            } else {
              // New reaction
              reactions[emoji] = { count: 1, users: [currentUser] };
            }

            return { ...post, reactions };
          }
          return post;
        })
      );
    }
  };

  const addComment = (postId: number) => {
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: Date.now(),
      postId,
      author: "John Doe",
      authorAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      content: newComment,
      createdAt: new Date().toISOString(),
      reactions: {},
    };

    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: [...post.comments, comment] }
          : post
      )
    );

    setNewComment("");
  };

  const createPost = () => {
    if (!newPost.title.trim() || !newPost.content.trim()) return;

    const post: Post = {
      id: Date.now(),
      type: newPost.type,
      priority: newPost.priority,
      title: newPost.title,
      content: newPost.content,
      author: "John Doe", // Current user
      authorAvatar:
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      authorRole: "HR Manager",
      createdAt: new Date().toISOString(),
      isPinned: newPost.priority === "urgent",
      isRead: false,
      audience: newPost.audience as any,
      targetDepartment: newPost.department || undefined,
      eventDate: newPost.eventDate || undefined,
      tags: newPost.tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      reactions: {},
      comments: [],
      isArchived: false,
    };

    setPosts((prev) => [post, ...prev]);

    // Reset form
    setNewPost({
      type: "announcement",
      priority: "normal",
      title: "",
      content: "",
      audience: "all",
      department: "",
      eventDate: "",
      tags: "",
    });
    setIsCreateDialogOpen(false);
  };

  const togglePin = (postId: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isPinned: !post.isPinned } : post
      )
    );
  };

  const markAsRead = (postId: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId ? { ...post, isRead: true } : post
      )
    );
  };

  const deletePost = (postId: number) => {
    setPosts((prev) => prev.filter((post) => post.id !== postId));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const PostCard = ({ post }: { post: Post }) => {
    const typeConfig = getPostTypeConfig(post.type);
    const TypeIcon = typeConfig.icon;

    return (
      <Card
        className={`border-slate-200 hover:shadow-sm transition-shadow ${!post.isRead ? "border-l-4 border-l-blue-500" : ""}`}
      >
        <CardContent className="p-6">
          {/* Post Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-3 flex-1">
              <Avatar className="w-10 h-10">
                <img
                  src={post.authorAvatar}
                  alt={post.author}
                  className="object-cover"
                />
                <AvatarFallback>
                  {post.author
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-slate-900">{post.author}</p>
                  <Badge variant="outline" className="text-xs">
                    {post.authorRole}
                  </Badge>
                  <span className="text-xs text-slate-500">•</span>
                  <span className="text-xs text-slate-500">
                    {formatDate(post.createdAt)}
                  </span>
                  {!post.isRead && (
                    <Badge className="bg-blue-500 text-white text-xs ml-2">
                      New
                    </Badge>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={{
                      borderColor: typeConfig.color,
                      color: typeConfig.color,
                    }}
                  >
                    <TypeIcon className="w-3 h-3 mr-1" />
                    {typeConfig.label}
                  </Badge>
                  {post.priority !== "normal" && (
                    <Badge
                      variant="outline"
                      className={`text-xs ${getPriorityColor(post.priority)}`}
                    >
                      {post.priority}
                    </Badge>
                  )}
                  {post.isPinned && <Pin className="w-3 h-3 text-amber-500" />}
                </div>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => markAsRead(post.id)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Mark as Read
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => togglePin(post.id)}>
                  <Pin className="w-4 h-4 mr-2" />
                  {post.isPinned ? "Unpin" : "Pin"} Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Bookmark className="w-4 h-4 mr-2" />
                  Save Post
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share className="w-4 h-4 mr-2" />
                  Share
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isHRUser && (
                  <>
                    <DropdownMenuItem>
                      <Edit3 className="w-4 h-4 mr-2" />
                      Edit Post
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deletePost(post.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Post Content */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">
                {post.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">{post.content}</p>
            </div>

            {/* Post Image */}
            {post.image && (
              <div className="rounded-lg overflow-hidden">
                <ImageWithFallback
                  src={post.image}
                  alt="Post image"
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Event Date */}
            {post.eventDate && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">
                  Event Date:{" "}
                  {new Date(post.eventDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            )}

            {/* Tags */}
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            <Separator />

            {/* Reactions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {Object.entries(post.reactions).map(([emoji, data]) => (
                  <Button
                    key={emoji}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 hover:bg-slate-100"
                    onClick={() => addReaction(post.id, emoji)}
                  >
                    <span className="text-base mr-1">{emoji}</span>
                    <span className="text-sm text-slate-600">{data.count}</span>
                  </Button>
                ))}

                {/* Add Reaction Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {emojiOptions.map((emoji) => (
                        <Button
                          key={emoji}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-lg hover:bg-slate-100"
                          onClick={() => addReaction(post.id, emoji)}
                        >
                          {emoji}
                        </Button>
                      ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setShowCommentsFor(
                      showCommentsFor === post.id ? null : post.id
                    )
                  }
                  className="h-8 px-2"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  <span className="text-sm text-slate-600">
                    {post.comments.length}
                  </span>
                </Button>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  <Share className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Comments Section */}
            {showCommentsFor === post.id && (
              <div className="mt-4 space-y-4 border-t border-slate-100 pt-4">
                {/* Comment Input */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-slate-100 text-slate-600 text-xs">
                      JD
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-2">
                    <Textarea
                      placeholder="Write a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="min-h-[60px] resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNewComment("")}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => addComment(post.id)}
                        disabled={!newComment.trim()}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Comment
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Comments List */}
                <div className="space-y-3">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <Avatar className="w-8 h-8">
                        <img
                          src={comment.authorAvatar}
                          alt={comment.author}
                          className="object-cover"
                        />
                        <AvatarFallback>
                          {comment.author
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-slate-900 text-sm">
                              {comment.author}
                            </p>
                            <span className="text-xs text-slate-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-slate-700 text-sm">
                            {comment.content}
                          </p>
                        </div>

                        {/* Comment Reactions */}
                        <div className="flex items-center gap-1 mt-1">
                          {Object.entries(comment.reactions).map(
                            ([emoji, data]) => (
                              <Button
                                key={emoji}
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1 text-xs hover:bg-slate-100"
                                onClick={() =>
                                  addReaction(post.id, emoji, true, comment.id)
                                }
                              >
                                <span className="text-sm mr-1">{emoji}</span>
                                <span className="text-xs text-slate-600">
                                  {data.count}
                                </span>
                              </Button>
                            )
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-1"
                              >
                                <Smile className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              <div className="grid grid-cols-4 gap-1 p-2">
                                {emojiOptions.map((emoji) => (
                                  <Button
                                    key={emoji}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-sm hover:bg-slate-100"
                                    onClick={() =>
                                      addReaction(
                                        post.id,
                                        emoji,
                                        true,
                                        comment.id
                                      )
                                    }
                                  >
                                    {emoji}
                                  </Button>
                                ))}
                              </div>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Announcements & Celebrations
            </h1>
            <p className="text-slate-600 mt-1">
              Stay connected with company news, birthdays, and achievements
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            {isHRUser && (
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                size="sm"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                New Post
              </Button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Total Posts</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {posts.filter((p) => !p.isArchived).length}
            </p>
            <p className="text-xs text-slate-500">This month</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Unread</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-slate-900">{unreadCount}</p>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-slate-500">Need attention</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Pinned</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {pinnedPosts.length}
            </p>
            <p className="text-xs text-slate-500">Important posts</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-slate-500" />
              <p className="text-sm text-slate-600">Engagement</p>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {posts.reduce(
                (total, post) =>
                  total +
                  Object.values(post.reactions).reduce(
                    (sum, reaction) => sum + reaction.count,
                    0
                  ),
                0
              )}
            </p>
            <p className="text-xs text-slate-500">Total reactions</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-slate-200">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <CardHeader className="pb-3">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="feed">Feed</TabsTrigger>
                  <TabsTrigger value="pinned">
                    Pinned
                    {pinnedPosts.length > 0 && (
                      <Badge className="ml-2 bg-amber-100 text-amber-800 text-xs">
                        {pinnedPosts.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="celebrations">Celebrations</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent>
                <TabsContent value="feed" className="space-y-6 mt-0">
                  {/* Search and Filters */}
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        placeholder="Search posts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="All Posts" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Posts</SelectItem>
                        {postTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Posts Feed */}
                  <div className="space-y-6">
                    {/* Pinned Posts */}
                    {pinnedPosts.length > 0 && (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <Pin className="w-4 h-4 text-amber-500" />
                          <h3 className="font-medium text-slate-900">
                            Pinned Posts
                          </h3>
                        </div>
                        {pinnedPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                        <Separator />
                      </div>
                    )}

                    {/* Regular Posts */}
                    {regularPosts.length > 0 ? (
                      <div className="space-y-4">
                        {regularPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Megaphone className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          No posts found
                        </h3>
                        <p className="text-slate-600">
                          Try adjusting your search criteria or check back
                          later.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pinned" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">Pinned Posts</h3>

                    {pinnedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {pinnedPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Pin className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          No pinned posts
                        </h3>
                        <p className="text-slate-600">
                          Important announcements will appear here when pinned.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="celebrations" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-slate-900">
                      Celebrations & Milestones
                    </h3>

                    {posts.filter((p) =>
                      [
                        "birthday",
                        "new_hire",
                        "achievement",
                        "celebration",
                      ].includes(p.type)
                    ).length > 0 ? (
                      <div className="space-y-4">
                        {posts
                          .filter((p) =>
                            [
                              "birthday",
                              "new_hire",
                              "achievement",
                              "celebration",
                            ].includes(p.type)
                          )
                          .map((post) => (
                            <PostCard key={post.id} post={post} />
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <PartyPopper className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">
                          No celebrations yet
                        </h3>
                        <p className="text-slate-600">
                          Birthdays, achievements, and celebrations will appear
                          here.
                        </p>
                      </div>
                    )}
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
              <Button
                className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700"
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4" />
                Create Post
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Bell className="w-4 h-4" />
                Manage Notifications
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Eye className="w-4 h-4" />
                Mark All Read
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2">
                <Archive className="w-4 h-4" />
                View Archive
              </Button>
            </CardContent>
          </Card>

          {/* Post Types */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="w-5 h-5" />
                Post Types
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {postTypes.slice(0, 6).map((type) => {
                const Icon = type.icon;
                const count = posts.filter(
                  (post) => post.type === type.value && !post.isArchived
                ).length;
                return (
                  <div
                    key={type.value}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: type.color }}
                      ></div>
                      <Icon className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-700">
                        {type.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-slate-900">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {posts
                .filter(
                  (post) =>
                    post.eventDate && new Date(post.eventDate) > new Date()
                )
                .slice(0, 3)
                .map((event) => (
                  <div key={event.id} className="p-3 bg-slate-50 rounded-lg">
                    <h4 className="font-medium text-slate-900 text-sm mb-1">
                      {event.title}
                    </h4>
                    <p className="text-xs text-slate-600">
                      {event.eventDate
                        ? new Date(event.eventDate).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : ""}
                    </p>
                  </div>
                ))}

              {posts.filter(
                (post) =>
                  post.eventDate && new Date(post.eventDate) > new Date()
              ).length === 0 && (
                <p className="text-sm text-slate-500 text-center py-4">
                  No upcoming events
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      New birthday celebration
                    </p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">
                      Company announcement posted
                    </p>
                    <p className="text-xs text-slate-500">5 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-slate-900">Achievement shared</p>
                    <p className="text-xs text-slate-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create Post Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Post</DialogTitle>
            <DialogDescription>
              Share announcements, celebrate milestones, or post company
              updates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post-type">Post Type *</Label>
                <Select
                  value={newPost.type}
                  onValueChange={(value) =>
                    setNewPost((prev) => ({ ...prev, type: value as PostType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select post type" />
                  </SelectTrigger>
                  <SelectContent>
                    {postTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <Icon
                              className="w-4 h-4"
                              style={{ color: type.color }}
                            />
                            {type.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="post-priority">Priority</Label>
                <Select
                  value={newPost.priority}
                  onValueChange={(value) =>
                    setNewPost((prev) => ({
                      ...prev,
                      priority: value as PostPriority,
                    }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent (Auto-pin)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-title">Title *</Label>
              <Input
                id="post-title"
                value={newPost.title}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="Enter post title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="post-content">Content *</Label>
              <Textarea
                id="post-content"
                placeholder="Write your post content..."
                value={newPost.content}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="post-audience">Audience</Label>
                <Select
                  value={newPost.audience}
                  onValueChange={(value) =>
                    setNewPost((prev) => ({ ...prev, audience: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="department">
                      Specific Department
                    </SelectItem>
                    <SelectItem value="managers">Managers Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newPost.audience === "department" && (
                <div className="space-y-2">
                  <Label htmlFor="target-department">Department</Label>
                  <Select
                    value={newPost.department}
                    onValueChange={(value) =>
                      setNewPost((prev) => ({ ...prev, department: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {newPost.type === "event" && (
              <div className="space-y-2">
                <Label htmlFor="event-date">Event Date & Time</Label>
                <Input
                  id="event-date"
                  type="datetime-local"
                  value={newPost.eventDate}
                  onChange={(e) =>
                    setNewPost((prev) => ({
                      ...prev,
                      eventDate: e.target.value,
                    }))
                  }
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="post-tags">Tags</Label>
              <Input
                id="post-tags"
                placeholder="Enter tags separated by commas"
                value={newPost.tags}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, tags: e.target.value }))
                }
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={createPost}
                disabled={!newPost.title.trim() || !newPost.content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Publish Post
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
