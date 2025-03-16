import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const supabaseUrl = "https://dabljjonrpbnidwnkwgz.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRhYmxqam9ucnBibmlkd25rd2d6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMTE2MjMxMiwiZXhwIjoyMDQ2NzM4MzEyfQ.zCTqC188P8VBkUOAo8n7jDkS4nlOaz8q1ZYhfQk2JgQ"; // Replace with your actual service role key

serve(async (req) => {
  console.log("M-Pesa Callback function triggered");

  if (req.method !== "POST") {
    console.error("Invalid HTTP method:", req.method);
    return new Response("Method Not Allowed", { status: 405 });
  }

  let requestBody;
  try {
    requestBody = await req.json();
    console.log(
      "Received callback body:",
      JSON.stringify(requestBody, null, 2)
    );
  } catch (error) {
    console.error("Error parsing request body:", error);
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!requestBody?.Body?.stkCallback) {
    console.error("Invalid callback data");
    return new Response("Invalid callback data", { status: 400 });
  }

  const stkCallback = requestBody.Body.stkCallback;
  const {
    MerchantRequestID = "N/A",
    CheckoutRequestID = "N/A",
    ResultCode = -1,
    ResultDesc = "No description",
    CallbackMetadata,
  } = stkCallback;

  console.log(`Transaction: ${CheckoutRequestID}, Result Code: ${ResultCode}`);

  // Extract metadata
  let metadata: Record<string, any> = {};
  let amount = 0; // Default to 0 if not found
  let mpesaReceiptNumber = null;
  let phoneNumber = null;

  if (CallbackMetadata?.Item) {
    try {
      CallbackMetadata.Item.forEach((item) => {
        if (item.Name === "Amount") amount = item.Value; // ✅ Ensure amount is set
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
        if (item.Name === "PhoneNumber") phoneNumber = item.Value;
        metadata[item.Name.toLowerCase()] = item.Value;
      });
    } catch (error) {
      console.error("Error processing metadata:", error);
      metadata["metadata_error"] = error.message;
    }
  }

  // Ensure phone number is in the correct format
  phoneNumber = phoneNumber || metadata.phonenumber || null;

  // Determine transaction status
  let status = "failed";
  switch (ResultCode) {
    case 0:
      status = "successful";
      break;
    case 1:
      status = "insufficient_balance";
      break;
    case 1032:
      status = "user_cancelled";
      break;
    case 2001:
      status = "invalid_initiator";
      break;
  }

  // ✅ Prepare update data
  const updateData = {
    result_code: ResultCode,
    result_desc: ResultDesc,
    is_successful: ResultCode === 0,
    mpesa_receipt_number: mpesaReceiptNumber,
    status,
    metadata,
    phone: phoneNumber,
    amount, // ✅ Ensure amount is included in the update
  };

  if (MerchantRequestID !== "N/A") {
    updateData.merchant_request_id = MerchantRequestID;
  }

  try {
    // ✅ Check if the transaction exists
    const existingTransactionRes = await fetch(
      `${supabaseUrl}/rest/v1/transactions?checkout_request_id=eq.${CheckoutRequestID}`,
      {
        method: "GET",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const existingTransaction = await existingTransactionRes.json();

    if (existingTransaction.length === 0) {
      // ✅ Insert a new transaction if it doesn't exist
      console.log("Transaction not found. Inserting a new record...");

      const insertRes = await fetch(`${supabaseUrl}/rest/v1/transactions`, {
        method: "POST",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          checkout_request_id: CheckoutRequestID,
          merchant_request_id: MerchantRequestID,
          result_code: ResultCode,
          result_desc: ResultDesc,
          is_successful: ResultCode === 0,
          mpesa_receipt_number: mpesaReceiptNumber,
          status,
          metadata,
          phone: phoneNumber,
          amount, // ✅ Ensure amount is included in the insert
        }),
      });

      if (!insertRes.ok) {
        const errorResponse = await insertRes.json();
        console.error("Supabase Insert Error:", errorResponse);
        return new Response("Failed to insert transaction", { status: 500 });
      }

      console.log("New transaction inserted successfully.");
      return new Response("Transaction inserted", { status: 201 });
    }

    // ✅ If record exists, update it
    console.log("Transaction found. Updating existing record...");
    const updateRes = await fetch(
      `${supabaseUrl}/rest/v1/transactions?checkout_request_id=eq.${CheckoutRequestID}`,
      {
        method: "PATCH",
        headers: {
          apikey: supabaseKey,
          Authorization: `Bearer ${supabaseKey}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify(updateData),
      }
    );

    if (!updateRes.ok) {
      const errorResponse = await updateRes.json();
      console.error("Supabase Update Error:", errorResponse);
      return new Response("Failed to update transaction", { status: 500 });
    }

    console.log("Transaction updated successfully in Supabase.");
    return new Response("Success", { status: 200 });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
});
