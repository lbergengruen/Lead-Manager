"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogPortal = DialogPrimitive.Portal;
export const DialogClose = DialogPrimitive.Close;

export function DialogOverlay(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>) {
  return (
    <DialogPrimitive.Overlay
      {...props}
      className={
        "fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] " + (props.className ?? "")
      }
    />
  );
}

export function DialogContent(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        {...props}
        className={
          "fixed left-1/2 top-1/2 z-50 w-[95vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-200 bg-white p-5 shadow-xl " +
          (props.className ?? "")
        }
      />
    </DialogPortal>
  );
}

export function DialogHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={"mb-4 space-y-1 " + (props.className ?? "")} />;
}

export function DialogTitle(props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      {...props}
      className={"text-base font-semibold tracking-tight " + (props.className ?? "")}
    />
  );
}

export function DialogDescription(
  props: React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
) {
  return (
    <DialogPrimitive.Description
      {...props}
      className={"text-sm text-slate-600 " + (props.className ?? "")}
    />
  );
}
