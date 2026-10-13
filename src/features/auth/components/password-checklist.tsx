import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const RULES: { label: string; test: (value: string) => boolean }[] = [
  { label: "Ít nhất 10 ký tự", test: (value) => value.length >= 10 },
  { label: "Có chữ hoa", test: (value) => /[A-Z]/.test(value) },
  { label: "Có chữ thường", test: (value) => /[a-z]/.test(value) },
  { label: "Có chữ số", test: (value) => /\d/.test(value) },
  { label: "Có ký tự đặc biệt (@$!%*?&)", test: (value) => /[@$!%*?&]/.test(value) },
];

/** The BE accepts only letters, digits and `@$!%*?&`; saying so as a rule would repeat the special-character line. */
const hasDisallowedCharacter = (value: string) => /[^A-Za-z\d@$!%*?&]/.test(value);

/** Which password rules are already met, so the user sees what is left instead of one error at the end. */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <div className="grid gap-1.5">
      <ul aria-label="Yêu cầu mật khẩu" className="grid gap-1.5 text-sm sm:grid-cols-2">
        {RULES.map((rule) => {
          const met = rule.test(value);
          return (
            <li key={rule.label} className={cn("flex items-center gap-2", met ? "text-success" : "text-muted-foreground")}>
              {met ? <Check className="size-4 shrink-0" aria-hidden /> : <Circle className="size-3 shrink-0" aria-hidden />}
              <span>{rule.label}</span>
              <span className="sr-only">{met ? ", đã đạt" : ", chưa đạt"}</span>
            </li>
          );
        })}
      </ul>
      {hasDisallowedCharacter(value) && (
        <p role="alert" className="text-sm text-danger">Chỉ dùng chữ, số và @$!%*?&. Hãy bỏ ký tự khác.</p>
      )}
    </div>
  );
}
