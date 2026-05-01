import { useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      const { data, error } = await supabase.auth.getSession();

      console.log("SESSION:", data);

      if (error) {
        console.error("Auth error:", error);
        navigate("/auth");
        return;
      }

      if (data?.session) {
        const email = data.session.user.email;

        // ✅ ADMIN CHECK
        if (email === "kim.swathi.07@gmail.com") {
          navigate("/");
        } else {
          navigate("/");
        }
      } else {
        navigate("/auth");
      }
    };

    handleAuth();
  }, [navigate]);

  return <div>Signing you in...</div>;
}
