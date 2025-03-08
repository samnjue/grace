const functions = require("firebase-functions");
const axios = require("axios");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const MPESA_CONSUMER_KEY = "mwlhG06Fwd9ZIjXmX9sorGjUyLJroBNiSdgik4Xuuk2OcRAW";
const MPESA_CONSUMER_SECRET =
  "7AfHhEgVIflnSejIQ2XeICIAfGPY47wtYRM4kkPawkJuZ5yox8DIAcgR3nB2S6lO";
const MPESA_SHORTCODE = "174379";
const MPESA_PASSKEY =
  "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";
const CALLBACK_URL =
  "https://us-central1-gracepesa-148fd.cloudfunctions.net/callback";

const getAccessToken = async () => {
  const auth = Buffer.from(
    `${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`
  ).toString("base64");
  const response = await axios.get(
    "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
    { headers: { Authorization: `Basic ${auth}` } }
  );
  return response.data.access_token;
};

exports.initiateSTKPush = functions.https.onRequest(async (req, res) => {
  try {
    console.log("STK Push Request:", req.body);

    const { phone, amount } = req.body;
    if (!phone || !amount) {
      return res.status(400).json({
        success: false,
        error: "Phone number and amount are required",
      });
    }

    const token = await getAccessToken();
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .substring(0, 14);
    const password = Buffer.from(
      `${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`
    ).toString("base64");

    const response = await axios.post(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: "CustomerPayBillOnline",
        Amount: amount,
        PartyA: phone,
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: phone,
        CallBackURL: CALLBACK_URL,
        AccountReference: "GraceChurch",
        TransactionDesc: "Church Donation",
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log("STK Push Response:", response.data);
    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error("Mpesa STK Push Error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

exports.callback = functions.https.onRequest(async (req, res) => {
  console.log(
    "Callback received - Headers:",
    JSON.stringify(req.headers, null, 2)
  );
  console.log("Callback received - Body:", JSON.stringify(req.body, null, 2));

  if (req.method !== "POST") {
    console.error("Invalid HTTP method:", req.method);
    return res.status(405).send("Method Not Allowed");
  }

  try {
    if (!req.body) {
      console.error("Empty request body");
      return res.status(200).send("Empty");
    }

    let transactionData = {
      raw_payload: req.body,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      status: "received",
    };

    let docId = `manual-${Date.now()}`;

    if (req.body.Body && req.body.Body.stkCallback) {
      const stkCallback = req.body.Body.stkCallback;

      const MerchantRequestID = stkCallback.MerchantRequestID || "N/A";
      const CheckoutRequestID = stkCallback.CheckoutRequestID || "N/A";
      const ResultCode =
        stkCallback.ResultCode !== undefined ? stkCallback.ResultCode : -1;
      const ResultDesc = stkCallback.ResultDesc || "No description";

      console.log(`T: ${CheckoutRequestID} C: ${ResultCode}`);

      transactionData = {
        ...transactionData,
        merchant_request_id: MerchantRequestID,
        checkout_request_id: CheckoutRequestID,
        result_code: ResultCode,
        result_desc: ResultDesc,
        is_successful: ResultCode === 0,
      };

      switch (ResultCode) {
        case 0:
          transactionData.status = "successful";
          break;
        case 1:
          transactionData.status = "insufficient_balance";
          break;
        case 1032:
          transactionData.status = "user_cancelled";
          break;
        case 2001:
          transactionData.status = "invalid_initiator";
          break;
        default:
          transactionData.status = "failed";
      }

      if (stkCallback.CallbackMetadata && stkCallback.CallbackMetadata.Item) {
        const metadata = {};
        try {
          stkCallback.CallbackMetadata.Item.forEach((item) => {
            if (item.Name) {
              metadata[item.Name.toLowerCase()] =
                item.Value !== undefined ? item.Value : null;
            }
          });
          transactionData.metadata = metadata;
        } catch (metadataError) {
          console.error("Error processing metadata:", metadataError);
          transactionData.metadata_error = metadataError.message;
        }
      }

      if (CheckoutRequestID && CheckoutRequestID !== "N/A") {
        docId = CheckoutRequestID;
      }
    } else if (req.body.checkout_request_id) {
      transactionData = {
        ...transactionData,
        merchant_request_id: req.body.merchant_request_id || "N/A",
        checkout_request_id: req.body.checkout_request_id || "N/A",
        result_code:
          req.body.result_code !== undefined ? req.body.result_code : -1,
        result_desc: req.body.result_desc || "No description",
        is_successful: req.body.result_code === 0,
      };

      if (req.body.result_code === 0) {
        transactionData.status = "successful";
      } else if (req.body.result_code === 1) {
        transactionData.status = "insufficient_balance";
      } else if (req.body.result_code === 1032) {
        transactionData.status = "user_cancelled";
      } else if (req.body.result_code === 2001) {
        transactionData.status = "invalid_initiator";
      } else {
        transactionData.status = "failed";
      }

      if (req.body.checkout_request_id) {
        docId = req.body.checkout_request_id;
      }
    }

    await db.collection("mpesa_transactions").doc(docId).set(transactionData);
    console.log(`Transaction saved in Firebase with ID: ${docId}`);

    return res.status(200).send("Success");
  } catch (error) {
    console.error("Error processing callback:", error.message);
    console.error("Error stack:", error.stack);

    try {
      await db.collection("mpesa_errors").add({
        error: error.message,
        stack: error.stack,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        request_body: req.body ? JSON.stringify(req.body) : "No body",
      });
    } catch (dbError) {
      console.error("Failed to log error to database:", dbError);
    }

    return res.status(200).send("Processed with errors");
  }
});
