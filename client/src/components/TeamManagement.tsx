import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card, CardHeader, CardContent, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import {
  Users,
  UserPlus,
  Crown,
  Edit,
  Eye,
  Trash2,
  Search,
} from "lucide-react";

interface User {
  id: string;
  username: string;
  email?: string;
}

interface ProjectMember {
  id: string;
  username: string;
  email?: string;
  role: "Owner" | "Editor" | "Viewer";
  joinedAt: Date;
}

interface TeamManagementProps {
  projectId: string;
  userRole: "Owner" | "Editor" | "Viewer";
}

const roleIcons = {
  Owner: <Crown className="w-4 h-4" />,
  Editor: <Edit className="w-4 h-4" />,
  Viewer: <Eye className="w-4 h-4" />,
};

const roleColors = {
  Owner:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Editor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Viewer: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

export function TeamManagement({ projectId, userRole }: TeamManagementProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<
    "Owner" | "Editor" | "Viewer"
  >("Viewer");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const queryClient = useQueryClient();

  // Fetch project members
  const { data: members = [], isLoading } = useQuery({
    queryKey: ["projectMembers", projectId],
    queryFn: async (): Promise<ProjectMember[]> => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/projects/${projectId}/members`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to fetch members");
      }
      const data = await response.json();
      return data.map((member: any) => ({
        ...member,
        joinedAt: new Date(member.joinedAt),
      }));
    },
  });

  // Search users
  const searchUsers = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/users/search?query=${encodeURIComponent(query)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (response.ok) {
        const results = await response.json();
        // Filter out users who are already members
        const memberIds = new Set(members.map((m) => m.id));
        setSearchResults(
          results.filter((user: User) => !memberIds.has(user.id))
        );
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add member mutation
  const addMemberMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(`/api/projects/${projectId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, role }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectMembers", projectId],
      });
      setIsAddDialogOpen(false);
      setSelectedUser(null);
      setSearchQuery("");
      setSearchResults([]);
    },
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}/role`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role }),
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to update role");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectMembers", projectId],
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `/api/projects/${projectId}/members/${userId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to remove member");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["projectMembers", projectId],
      });
    },
  });

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers(searchQuery);
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, members]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Team Members ({members.length})
          </CardTitle>
          {userRole === "Owner" && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Team Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="search">Search Users</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="search"
                        placeholder="Enter username..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {isSearching && (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  )}

                  {searchResults.length > 0 && (
                    <div className="space-y-2">
                      <Label>Search Results</Label>
                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {searchResults.map((user) => (
                          <div
                            key={user.id}
                            className={`p-3 border rounded-lg cursor-pointer hover:bg-accent ${
                              selectedUser?.id === user.id
                                ? "bg-accent border-primary"
                                : ""
                            }`}
                            onClick={() => setSelectedUser(user)}
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="w-8 h-8">
                                <AvatarFallback>
                                  {user.username.charAt(0).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">
                                  {user.username}
                                </div>
                                {user.email && (
                                  <div className="text-sm text-muted-foreground">
                                    {user.email}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUser && (
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select
                        value={selectedRole}
                        onValueChange={(value: "Owner" | "Editor" | "Viewer") =>
                          setSelectedRole(value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Viewer">
                            Viewer - Can view all content
                          </SelectItem>
                          <SelectItem value="Editor">
                            Editor - Can edit content and manage tasks
                          </SelectItem>
                          <SelectItem value="Owner">
                            Owner - Full access including member management
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsAddDialogOpen(false);
                        setSelectedUser(null);
                        setSearchQuery("");
                        setSearchResults([]);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() =>
                        selectedUser &&
                        addMemberMutation.mutate({
                          userId: selectedUser.id,
                          role: selectedRole,
                        })
                      }
                      disabled={!selectedUser || addMemberMutation.isPending}
                    >
                      {addMemberMutation.isPending ? "Adding..." : "Add Member"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarFallback>
                    {member.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{member.username}</div>
                  {member.email && (
                    <div className="text-sm text-muted-foreground">
                      {member.email}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Joined {member.joinedAt.toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={roleColors[member.role]} variant="secondary">
                  <div className="flex items-center gap-1">
                    {roleIcons[member.role]}
                    {member.role}
                  </div>
                </Badge>
                {userRole === "Owner" && member.role !== "Owner" && (
                  <div className="flex items-center gap-1">
                    <Select
                      value={member.role}
                      onValueChange={(value: "Owner" | "Editor" | "Viewer") =>
                        updateRoleMutation.mutate({
                          userId: member.id,
                          role: value,
                        })
                      }
                    >
                      <SelectTrigger className="w-32 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Viewer">Viewer</SelectItem>
                        <SelectItem value="Editor">Editor</SelectItem>
                        <SelectItem value="Owner">Owner</SelectItem>
                      </SelectContent>
                    </Select>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Remove Team Member
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {member.username}{" "}
                            from this project? They will lose all access to
                            project files and conversations.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() =>
                              removeMemberMutation.mutate(member.id)
                            }
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
