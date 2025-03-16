import { supabase } from "../utils/supabase.js";

export const initiateSTKPush = async (phone, amount, accountReference) => {
  try {
    const response = await fetch(
      "https://dabljjonrpbnidwnkwgz.supabase.co/functions/v1/initiateSTKPush",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, amount, accountReference }),
      }
    );

    const jsonResponse = await response.json();
    console.log("STK Push Response:", jsonResponse);

    return jsonResponse;
  } catch (error) {
    console.error("STK Push Error:", error);
    throw error;
  }
};

export const checkTransactionStatus = async (checkoutRequestId) => {
  const { data, error } = await supabase
    .from("transactions")
    .select("*")
    .eq("checkout_request_id", checkoutRequestId)
    .single();

  return { data, error };
};
