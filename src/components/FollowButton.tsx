import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, UserMinus } from "lucide-react";

interface FollowButtonProps {
  userId: string;
  className?: string;
}

export const FollowButton = ({ userId, className = "" }: FollowButtonProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.id === userId) return;
    
    const checkFollowStatus = async () => {
      const { data } = await supabase
        .from("followers")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", userId)
        .maybeSingle();
      
      setIsFollowing(!!data);
    };
    
    checkFollowStatus();
  }, [user, userId]);

  const handleFollow = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from("followers")
          .delete()
          .eq("follower_id", user.id)
          .eq("following_id", userId);
        
        if (error) throw error;
        setIsFollowing(false);
        toast({ title: "Deixou de seguir" });
      } else {
        const { error } = await supabase
          .from("followers")
          .insert({
            follower_id: user.id,
            following_id: userId
          });
        
        if (error) throw error;
        setIsFollowing(true);
        toast({ title: "Agora você está seguindo" });
      }
    } catch (error: any) {
      toast({ 
        title: "Erro", 
        description: error.message,
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user || user.id === userId) return null;

  return (
    <Button
      onClick={handleFollow}
      disabled={loading}
      variant={isFollowing ? "outline" : "default"}
      size="sm"
      className={className}
    >
      {isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Seguir
        </>
      )}
    </Button>
  );
};