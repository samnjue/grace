export const OPTIONS = { isPublic: true };
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const { phone, amount, accountReference } = await req.json();

    const consumerKey = "mwlhG06Fwd9ZIjXmX9sorGjUyLJroBNiSdgik4Xuuk2OcRAW";
    const consumerSecret =
      "7AfHhEgVIflnSejIQ2XeICIAfGPY47wtYRM4kkPawkJuZ5yox8DIAcgR3nB2S6lO";
    const shortCode = "174379";
    const passKey =
      "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

    const auth = btoa(`${consumerKey}:${consumerSecret}`);
    const tokenRes = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      { headers: { Authorization: `Basic ${auth}` } }
    );

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok) {
      return new Response(
        JSON.stringify({
          error: "Failed to get access token",
          details: tokenData,
        }),
        { status: 500 }
      );
    }

    const { access_token } = tokenData;

    let formattedPhone = phone;
    if (phone.startsWith("0")) {
      formattedPhone = "254" + phone.substring(1);
    } else if (phone.length === 9) {
      formattedPhone = "254" + phone;
    }

    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:Z]/g, "")
      .slice(0, 14);
    const password = btoa(shortCode + passKey + timestamp);

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          BusinessShortCode: shortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: formattedPhone,
          PartyB: shortCode,
          PhoneNumber: formattedPhone,
          CallBackURL:
            "https://dabljjonrpbnidwnkwgz.supabase.co/functions/v1/callback",
          AccountReference: accountReference,
          TransactionDesc: "Payment",
        }),
      }
    );

    const stkResponse = await response.json();
    console.log("M-Pesa STK Response:", stkResponse);

    if (!stkResponse.CheckoutRequestID) {
      return new Response(
        JSON.stringify({
          error: "M-Pesa STK request failed",
          details: stkResponse,
        }),
        { status: 500 }
      );
    }

    const supabaseUrl = "https://dabljjonrpbnidwnkwgz.supabase.co";
    const supabaseKey =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYmxqam9ucnBibmlkd25rd2d6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzExNjIzMTIsImV4cCI6MjA0NjczODMxMn0.heJ-OmceVakcQElnBp7tXYsxyHnMR5hhg4xR6R0A03o";

    try {
      // Insert into transactions table
      // await fetch(`${supabaseUrl}/rest/v1/transactions`, {
      //   method: "POST",
      //   headers: {
      //     apikey: supabaseKey,
      //     Authorization: `Bearer ${supabaseKey}`,
      //     "Content-Type": "application/json",
      //     Prefer: "return=minimal",
      //   },
      //   body: JSON.stringify({
      //     phone,
      //     amount,
      //     account_reference: accountReference,
      //     checkout_request_id: stkResponse.CheckoutRequestID,
      //   }),
      // });

      const mpesaRes = await fetch(`${supabaseUrl}/rest/v1/mpesa`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({
          phone,
          account_reference: accountReference,
          checkout_request_id: stkResponse.CheckoutRequestID,
        }),
      });

      if (!mpesaRes.ok) {
        const mpesaError = await mpesaRes.text();
        console.error("Supabase MPESA Insert Error:", mpesaError);
      } else {
        console.log("Supabase MPESA Insert Success");
      }
    } catch (dbError) {
      console.error("Database operation error:", dbError);
    }

    return new Response(JSON.stringify(stkResponse), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("General error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error occurred" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
});
