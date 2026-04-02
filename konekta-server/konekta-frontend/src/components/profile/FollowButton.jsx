import { useState } from "react";
import { useFollowUser, useUnfollowUser } from "../../hooks/useUsers";
import Button from "../ui/Button";
import { toast } from "react-hot-toast";

export default function FollowButton({ userId, isFollowing: initialFollowing, size = "sm" }) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing || false);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  const loading = followMutation.isPending || unfollowMutation.isPending;

  const handleClick = async () => {
    const prev = isFollowing;
    setIsFollowing(!prev);
    try {
      if (prev) {
        await unfollowMutation.mutateAsync(userId);
      } else {
        await followMutation.mutateAsync(userId);
      }
    } catch {
      setIsFollowing(prev);
      toast.error("Action failed");
    }
  };

  return (
    <Button
      variant={isFollowing ? "outline" : "primary"}
      size={size}
      onClick={handleClick}
      loading={loading}
    >
      {isFollowing ? "Unfollow" : "Follow"}
    </Button>
  );
}
