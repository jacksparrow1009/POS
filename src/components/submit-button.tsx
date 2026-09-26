"use client";

import { useFormStatus } from "react-dom";

type SubmitButtonProps = {
  children: React.ReactNode;
  pendingLabel: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({
  children,
  pendingLabel,
  className = "",
  disabled = false,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      aria-disabled={pending || disabled}
      className={`inline-flex items-center justify-center gap-2 disabled:cursor-wait disabled:opacity-70 ${className}`}
      disabled={pending || disabled}
      type="submit"
    >
      {pending ? (
        <>
          <span
            aria-hidden="true"
            className="size-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
          />
          <span>{pendingLabel}</span>
        </>
      ) : (
        <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
          {children}
        </span>
      )}
    </button>
  );
}
