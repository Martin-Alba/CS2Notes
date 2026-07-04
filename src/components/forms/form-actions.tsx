import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type FormActionsProps = {
  children?: ReactNode;
  loading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
};

export function FormActions({
  loading,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  onCancel,
  children,
}: FormActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button type="submit" variant="primary" loading={loading}>
        {submitLabel}
      </Button>
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel}>
          {cancelLabel}
        </Button>
      )}
      {children}
    </div>
  );
}
