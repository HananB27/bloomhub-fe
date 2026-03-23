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
import { QuickActionButton } from "./QuickActionButton";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  Trophy,
  Cake,
  PartyPopper,
  UserPlus,
  Bell,
  Eye,
  Edit3,
  Trash2,
  Send,
  Bookmark,
  TrendingUp,
  Activity,
  Settings,
  Archive,
  Volume2,
  HandMetal,
  Flame,
  Award,
  CircleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatRelativeTimestamp } from "@/utils";
import { useSession } from "next-auth/react";

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
  reactions: { [reactionId: string]: { count: number; users: string[] } };
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
  reactions: { [reactionId: string]: { count: number; users: string[] } };
}

const reactionOptions: { id: string; Icon: LucideIcon }[] = [
  { id: "thumbsup", Icon: ThumbsUp },
  { id: "heart", Icon: Heart },
  { id: "smile", Icon: Smile },
  { id: "party", Icon: PartyPopper },
  { id: "clap", Icon: HandMetal },
  { id: "flame", Icon: Flame },
  { id: "award", Icon: Award },
  { id: "alert", Icon: CircleAlert },
];

export function AnnouncementsModule() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState("feed");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
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

  // TODO: Implement - fetch announcements and posts from API
  const [posts, setPosts] = useState<Post[]>([]);

  const postTypes: {
    value: PostType;
    label: string;
    icon: LucideIcon;
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
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
      default:
        return "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700";
    }
  };

  const addReaction = (
    postId: number,
    reactionId: string,
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

              if (reactions[reactionId]) {
                const userIndex =
                  reactions[reactionId].users.indexOf(currentUser);
                if (userIndex > -1) {
                  // Remove reaction
                  reactions[reactionId].users.splice(userIndex, 1);
                  reactions[reactionId].count = Math.max(
                    0,
                    reactions[reactionId].count - 1
                  );
                  if (reactions[reactionId].count === 0) {
                    delete reactions[reactionId];
                  }
                } else {
                  // Add reaction
                  reactions[reactionId].users.push(currentUser);
                  reactions[reactionId].count++;
                }
              } else {
                // New reaction
                reactions[reactionId] = { count: 1, users: [currentUser] };
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

            if (reactions[reactionId]) {
              const userIndex =
                reactions[reactionId].users.indexOf(currentUser);
              if (userIndex > -1) {
                // Remove reaction
                reactions[reactionId].users.splice(userIndex, 1);
                reactions[reactionId].count = Math.max(
                  0,
                  reactions[reactionId].count - 1
                );
                if (reactions[reactionId].count === 0) {
                  delete reactions[reactionId];
                }
              } else {
                // Add reaction
                reactions[reactionId].users.push(currentUser);
                reactions[reactionId].count++;
              }
            } else {
              // New reaction
              reactions[reactionId] = { count: 1, users: [currentUser] };
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
      author: session?.user?.name || "John Doe",
      authorAvatar:
        session?.user?.image ||
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
      author: session?.user?.name || "John Doe", // Current user
      authorAvatar:
        session?.user?.image ||
        "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      authorRole:
        (session?.user as { career_level?: string })?.career_level ||
        "HR Manager",
      createdAt: new Date().toISOString(),
      isPinned: newPost.priority === "urgent",
      isRead: false,
      audience: newPost.audience as Post["audience"],
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

  const PostCard = ({ post }: { post: Post }) => {
    const typeConfig = getPostTypeConfig(post.type);
    const TypeIcon = typeConfig.icon;

    return (
      <Card
        className={`border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow ${!post.isRead ? "border-l-4 border-l-blue-500" : ""}`}
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
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {post.author}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {post.authorRole}
                  </Badge>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    •
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatRelativeTimestamp(post.createdAt)}
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
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {post.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {post.content}
              </p>
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
                {Object.entries(post.reactions).map(([reactionId, data]) => {
                  const option = reactionOptions.find(
                    (o) => o.id === reactionId
                  );
                  const Icon = option?.Icon ?? CircleAlert;
                  return (
                    <Button
                      key={reactionId}
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700"
                      onClick={() => addReaction(post.id, reactionId)}
                    >
                      <Icon className="h-4 w-4 mr-1" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {data.count}
                      </span>
                    </Button>
                  );
                })}

                {/* Add Reaction Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 px-2">
                      <Smile className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {reactionOptions.map(({ id, Icon }) => (
                        <Button
                          key={id}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700"
                          onClick={() => addReaction(post.id, id)}
                        >
                          <Icon className="h-4 w-4" />
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
                  <span className="text-sm text-gray-600 dark:text-gray-400">
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
              <div className="mt-4 space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                {/* Comment Input */}
                <div className="flex gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs">
                      {session?.user?.name
                        ? session.user.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                        : "JD"}
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
                        variant="primary"
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
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                              {comment.author}
                            </p>
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {formatRelativeTimestamp(comment.createdAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm">
                            {comment.content}
                          </p>
                        </div>

                        {/* Comment Reactions */}
                        <div className="flex items-center gap-1 mt-1">
                          {Object.entries(comment.reactions).map(
                            ([reactionId, data]) => {
                              const option = reactionOptions.find(
                                (o) => o.id === reactionId
                              );
                              const Icon = option?.Icon ?? CircleAlert;
                              return (
                                <Button
                                  key={reactionId}
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700"
                                  onClick={() =>
                                    addReaction(
                                      post.id,
                                      reactionId,
                                      true,
                                      comment.id
                                    )
                                  }
                                >
                                  <Icon className="h-3 w-3 mr-1" />
                                  <span className="text-xs text-gray-600 dark:text-gray-400">
                                    {data.count}
                                  </span>
                                </Button>
                              );
                            }
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
                                {reactionOptions.map(({ id, Icon }) => (
                                  <Button
                                    key={id}
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700"
                                    onClick={() =>
                                      addReaction(post.id, id, true, comment.id)
                                    }
                                  >
                                    <Icon className="h-3 w-3" />
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
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Announcements & Celebrations
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
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
                variant="primary"
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
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Megaphone className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total Posts
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {posts.filter((p) => !p.isArchived).length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              This month
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Unread</p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {unreadCount}
              </p>
              {unreadCount > 0 && (
                <Badge className="bg-red-500 text-white text-xs">
                  {unreadCount}
                </Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Need attention
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Pin className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Pinned</p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {pinnedPosts.length}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Important posts
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Engagement
              </p>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
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
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Total reactions
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3">
          <Card className="border-gray-200 dark:border-gray-700">
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
                      <Search className="absolute left-3 top-1/2 transform -trangray-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
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
                          <h3 className="font-medium text-gray-900 dark:text-gray-100">
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
                        <Megaphone className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No posts found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Try adjusting your search criteria or check back
                          later.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="pinned" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      Pinned Posts
                    </h3>

                    {pinnedPosts.length > 0 ? (
                      <div className="space-y-4">
                        {pinnedPosts.map((post) => (
                          <PostCard key={post.id} post={post} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Pin className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No pinned posts
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                          Important announcements will appear here when pinned.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="celebrations" className="space-y-6 mt-0">
                  <div className="space-y-4">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
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
                        <PartyPopper className="w-12 h-12 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                          No celebrations yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
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
          <Card className="border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <QuickActionButton
                label="Create Post"
                icon={Plus}
                onClick={() => setIsCreateDialogOpen(true)}
                variant="primary"
              />
              <QuickActionButton
                label="Manage Notifications"
                icon={Bell}
                onClick={() => {}}
              />
              <QuickActionButton
                label="Mark All Read"
                icon={Eye}
                onClick={() => {}}
              />
              <QuickActionButton
                label="View Archive"
                icon={Archive}
                onClick={() => {}}
              />
            </CardContent>
          </Card>

          {/* Post Types */}
          <Card className="border-gray-200 dark:border-gray-700">
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
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {type.label}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {count}
                    </span>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Upcoming Events */}
          <Card className="border-gray-200 dark:border-gray-700">
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
                  <div
                    key={event.id}
                    className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                  >
                    <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm mb-1">
                      {event.title}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
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
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No upcoming events
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="border-gray-200 dark:border-gray-700">
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
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      New birthday celebration
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      2 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Company announcement posted
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      5 hours ago
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-amber-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      Achievement shared
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      1 day ago
                    </p>
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
                variant="primary"
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
