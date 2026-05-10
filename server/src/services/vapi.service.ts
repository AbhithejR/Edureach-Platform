import https from "node:https";

interface CallPayload {
  phoneNumber: string;
  userName: string;
  userEmail: string;
  preferredCourse?: string;
  queryTopic?: string;
}

export const initiateOutboundCall = async (payload: CallPayload): Promise<{ callId: string; status: string }> => {
  const { phoneNumber, userName, preferredCourse, queryTopic } = payload;

  const formattedPhone = phoneNumber.startsWith("+")
    ? phoneNumber
    : `+91${phoneNumber.replace(/\D/g, "")}`;

  const firstMessage = `Hello ${userName}! I'm Ava from EduReach College. ${
    preferredCourse ? `I understand you're interested in ${preferredCourse}.` : ""
  } ${
    queryTopic ? `You wanted to know about ${queryTopic}.` : ""
  } How can I help you today?`;

  const body = JSON.stringify({
    assistantId: process.env.VAPI_ASSISTANT_ID,
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    customer: {
      number: formattedPhone,
    },
    assistantOverrides: {
      firstMessage,
    },
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.vapi.ai",
      path: "/call",
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VAPI_API_KEY}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => { data += chunk; });
      res.on("end", () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.id) {
            resolve({ callId: parsed.id, status: parsed.status || "queued" });
          } else {
            reject(new Error(parsed.message || "Failed to initiate call"));
          }
        } catch {
          reject(new Error("Invalid response from Vapi"));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
};