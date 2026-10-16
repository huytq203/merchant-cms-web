import { Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: "ít nhất 8 ký tự", test: (value) => value.length >= 8 },
  { label: "Có chữ hoa", test: (value) => /[A-Z]/.test(value) },
  { label: "Có chữ thường", test: (value) => /[a-z]/.test(value) },
  { label: "Có chữ số", test: (value) => /\d/.test(value) },
  {
    label: "Có ký tự đặc biệt (@$!%*?&)",
    test: (value) => /[@$!%*?&]/.test(value),
  },
];

/** The BE accepts only letters, digits and `@$!%*?&`; saying so as a rule would repeat the special-character line. */
const hasDisallowedCharacter = (value: string) =>
  /[^A-Za-z\d@$!%*?&]/.test(value);

/** Which password rules are already met, so the user sees what is left instead of one error at the end. */
export function PasswordChecklist({ value }: { value: string }) {
  const results = RULES.map((rule) => ({
    label: rule.label,
    met: rule.test(value),
  }));
  const metCount = results.filter((result) => result.met).length;
  return (
    <div className="grid gap-2.5 rounded-xl bg-muted p-4">
      <p className="text-sm font-semibold text-foreground">
        Mật khẩu cần đạt đủ {RULES.length} điều kiện{" "}
        <span className="font-normal text-primary">
          ({metCount}/{RULES.length})
        </span>
      </p>
      <ul aria-label="Yêu cầu mật khẩu" className="grid gap-2 text-sm">
        {results.map(({ label, met }) => (
          <li
            key={label}
            className={cn(
              "flex items-center gap-2.5",
              met ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "grid size-5 shrink-0 place-items-center rounded-full border",
                met
                  ? "border-success bg-success text-white"
                  : "border-border bg-background",
              )}
              aria-hidden
            >
              {met ? <Check className="size-3" /> : null}
            </span>
            <span>{label}</span>
            <span className="sr-only">{met ? ", đã đạt" : ", chưa đạt"}</span>
          </li>
        ))}
      </ul>
      {hasDisallowedCharacter(value) && (
        <p role="alert" className="text-sm text-danger">
          Chỉ dùng chữ, số và @$!%*?&. Hãy bỏ ký tự khác.
        </p>
      )}
    </div>
  );
}
