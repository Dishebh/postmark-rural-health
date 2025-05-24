import React from "react";
import {
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from "@mui/material";
import {
  Email as EmailIcon,
  Reply as ReplyIcon,
  Person as PersonIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";
import { format } from "date-fns";

const timelineSteps = [
  {
    key: "email_received",
    label: "Email Received",
    icon: EmailIcon,
    getTimestamp: (report) => report.created_at,
    alwaysShow: true,
  },
  {
    key: "auto_reply_sent",
    label: "Auto-reply Sent",
    icon: ReplyIcon,
    getTimestamp: (report) => report.auto_reply_sent_at || report.created_at,
    alwaysShow: true,
  },
  {
    key: "responder_assigned",
    label: "Responder Assigned",
    icon: PersonIcon,
    getTimestamp: (report) => report.responder_assigned_at,
    getLabel: (report) => `Assigned to ${report.responder_name || "Unknown"}`,
    alwaysShow: false,
    shouldShow: (report) => Boolean(report.responder_name),
  },
  {
    key: "marked_resolved",
    label: "Marked Resolved",
    icon: CheckCircleIcon,
    getTimestamp: (report) => report.resolved_at,
    alwaysShow: false,
    shouldShow: (report) => report.status === "resolved",
  },
];

const RequestTimeline = ({ report }) => {
  if (!report) return null;

  const activeStep = timelineSteps.findIndex(
    (step) => step.shouldShow?.(report) ?? step.alwaysShow
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Typography
        variant="subtitle1"
        sx={{
          fontWeight: 500,
          mb: 2,
          color: "text.secondary",
        }}
      >
        Request Timeline
      </Typography>

      <Stepper
        orientation="vertical"
        activeStep={activeStep}
        sx={{
          "& .MuiStepLabel-iconContainer": {
            paddingRight: 2,
          },
          "& .MuiStepLabel-label": {
            fontSize: "0.875rem",
          },
          "& .MuiStepContent-root": {
            paddingLeft: 3.5,
            paddingTop: 0.5,
          },
        }}
      >
        {timelineSteps.map((step, index) => {
          if (!step.alwaysShow && !step.shouldShow?.(report)) {
            return null;
          }

          const timestamp = step.getTimestamp(report);
          const label = step.getLabel?.(report) || step.label;
          const Icon = step.icon;

          return (
            <Step key={step.key} completed={index <= activeStep}>
              <StepLabel
                StepIconComponent={() => (
                  <Icon
                    sx={{
                      color:
                        index <= activeStep
                          ? "primary.main"
                          : "action.disabled",
                      fontSize: "1.25rem",
                    }}
                  />
                )}
              >
                {label}
              </StepLabel>
              <StepContent>
                {timestamp && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      display: "block",
                      mt: 0.5,
                    }}
                  >
                    {format(new Date(timestamp), "PPpp")}
                  </Typography>
                )}
              </StepContent>
            </Step>
          );
        })}
      </Stepper>
    </Box>
  );
};

export default RequestTimeline;
