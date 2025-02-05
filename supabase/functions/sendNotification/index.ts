import { serve } from "https://deno.land/std@0.131.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
  
serve(async (req) => {
  try {
    // Read the request body
    const { record } = await req.json();

    if (!record || !record.district_id || !record.message) {
      return new Response(JSON.stringify({ error: "Invalid data" }), { status: 400 });
    }

    // Initialize Supabase client (using environment variables for security)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get push tokens for the district
    const { data, error } = await supabase
      .from("users")
      .select("push_token")
      .eq("selected_district", record.district_id)
      .not("push_token", "is", null);

    if (error) {
      console.error("Error fetching push tokens:", error.message);
      return new Response(JSON.stringify({ error: "Database error" }), { status: 500 });
    }

    // Extract tokens
    const expoPushTokens = data.map((user) => user.expo_push_token);

    if (expoPushTokens.length === 0) {
      return new Response(JSON.stringify({ message: "No users with push tokens." }), { status: 200 });
    }

    // Prepare notification payload
    const messages = expoPushTokens.map((token) => ({
      to: token,
      sound: "default",
      title: "District News",
      body: record.message,
      data: { district_id: record.district_id },
    }));

    // Send push notification
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(messages),
    });

    const pushResponse = await response.json();
    console.log("Push Notification Response:", pushResponse);

    return new Response(JSON.stringify({ success: true, pushResponse }), { status: 200 });

  } catch (error) {
    console.error("Function error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
  }
});
