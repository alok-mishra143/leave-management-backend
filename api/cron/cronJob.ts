import { CronJob } from "cron";
import { db } from "../db/prismaClient";
import { sendMail } from "../mail/sendMail";
import fs from "fs";
import path from "path";

const leaveTemplate = path.join(__dirname, "../mail/leaveEmailTemplate.html");

const getAllPendingRequests = async () => {
  try {
    const response = await db.user.findMany({
      where: {
        requestedLeaves: {
          some: { status: "PENDING" },
        },
      },
      select: {
        email: true,
        _count: {
          select: { requestedLeaves: { where: { status: "PENDING" } } },
        },
      },
    });

    // Format the result
    const result = response.map((user) => ({
      requestedTo: user.email,
      pendingRequests: user._count.requestedLeaves,
    }));

    return result;
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    return [];
  }
};

export const job = new CronJob(
  "0 0 7 * * *", // Runs every day at 9:00 AM
  async function () {
    const pendingRequests = await getAllPendingRequests();

    for (const request of pendingRequests) {
      const emailHtml = fs
        .readFileSync(leaveTemplate, "utf-8")
        .replace("{{PENDING_COUNT}}", request.pendingRequests.toString())
        .replace("{{LEAVE_MANAGEMENT_URL}}", `${process.env.NEXTJS_URL!}`);

      await sendMail({
        to: request.requestedTo,
        subject: "You have pending leave requests",
        html: emailHtml,
      });
    }

    await db.otp.deleteMany({
      where: {
        createdAt: {
          lte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
    });
  },
  null, // onComplete
  true, // start immediately
  "Asia/Kolkata" // Indian Time Zone
);
