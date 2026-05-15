"use client";

import { useActionState, useEffect, useState } from "react";
import { Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LANGUAGE_LABEL, LANGUAGE_LEVEL_TERM } from "@/constants/languages";
import { GRADES } from "@/types/domain";
import type { Language } from "@/types/domain";
import { cn } from "@/lib/utils";

import { createBook, updateBook, type BookFormState } from "./actions";

const FIELD_LABEL_CLASS =
  "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

type Book = {
  id: string;
  title: string;
  author: string | null;
  publisher: string | null;
  grade_level: number | null;
  language: string;
  level: string | null;
  cover_image_url: string | null;
};

type Mode = { type: "create" } | { type: "edit"; book: Book };

const INITIAL_STATE: BookFormState = {};

export function BookFormDialog({
  mode,
  open,
  onOpenChange,
}: {
  mode: Mode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const isEdit = mode.type === "edit";
  const action = isEdit ? updateBook : createBook;
  const [state, formAction, pending] = useActionState<BookFormState, FormData>(
    action,
    INITIAL_STATE,
  );

  const initialLanguage = (
    isEdit ? mode.book.language : "ko"
  ) as Language;
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    isEdit ? mode.book.cover_image_url : null,
  );

  useEffect(() => {
    if (state.ok) onOpenChange(false);
  }, [state.ok, onOpenChange]);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPreview(URL.createObjectURL(file));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "책 수정" : "책 등록"}</DialogTitle>
          <DialogDescription>
            ID는 자동 발급되며 라벨 PDF에서 바코드로 출력됩니다.
          </DialogDescription>
        </DialogHeader>
        <form
          action={formAction}
          key={isEdit ? mode.book.id : "create"}
          className="space-y-5"
        >
          {isEdit ? (
            <input type="hidden" name="id" value={mode.book.id} />
          ) : null}

          <div className="grid grid-cols-[1fr_auto] gap-5">
            <div className="space-y-5">
              <div className="space-y-2">
                <Label className={FIELD_LABEL_CLASS}>언어</Label>
                <div className="flex gap-2">
                  {(["ko", "en"] as const).map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      disabled={pending}
                      className={cn(
                        "flex-1 rounded-md border px-3 py-2 text-sm transition-colors",
                        language === lang
                          ? lang === "ko"
                            ? "border-ko bg-ko text-ko-foreground"
                            : "border-en bg-en text-en-foreground"
                          : "hover:bg-muted/50",
                      )}
                    >
                      {LANGUAGE_LABEL[lang].full}
                    </button>
                  ))}
                </div>
                <input type="hidden" name="language" value={language} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className={FIELD_LABEL_CLASS}>
                  제목
                </Label>
                <Input
                  id="title"
                  name="title"
                  defaultValue={isEdit ? mode.book.title : ""}
                  required
                  disabled={pending}
                  placeholder="예: 강아지똥"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="author" className={FIELD_LABEL_CLASS}>
                    저자
                  </Label>
                  <Input
                    id="author"
                    name="author"
                    defaultValue={isEdit ? mode.book.author ?? "" : ""}
                    disabled={pending}
                    placeholder="(선택)"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="publisher" className={FIELD_LABEL_CLASS}>
                    출판사
                  </Label>
                  <Input
                    id="publisher"
                    name="publisher"
                    defaultValue={isEdit ? mode.book.publisher ?? "" : ""}
                    disabled={pending}
                    placeholder="(선택)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="grade_level" className={FIELD_LABEL_CLASS}>
                    권장 학년
                  </Label>
                  <Select
                    name="grade_level"
                    defaultValue={
                      isEdit && mode.book.grade_level
                        ? String(mode.book.grade_level)
                        : "none"
                    }
                    disabled={pending}
                  >
                    <SelectTrigger id="grade_level" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">없음</SelectItem>
                      {GRADES.map((g) => (
                        <SelectItem key={g} value={String(g)}>
                          {g}학년
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level" className={FIELD_LABEL_CLASS}>
                    {LANGUAGE_LEVEL_TERM[language]}
                  </Label>
                  <Input
                    id="level"
                    name="level"
                    defaultValue={isEdit ? mode.book.level ?? "" : ""}
                    disabled={pending}
                    placeholder={
                      language === "ko" ? "예: 2단계" : "예: AR 2.5"
                    }
                  />
                </div>
              </div>
            </div>

            <div className="w-32 space-y-2">
              <Label className={FIELD_LABEL_CLASS}>표지</Label>
              <input
                type="file"
                name="cover"
                id="cover-file"
                accept="image/*"
                className="sr-only"
                onChange={handleCoverChange}
                disabled={pending}
              />
              <label
                htmlFor="cover-file"
                className={cn(
                  "flex h-44 w-32 cursor-pointer flex-col items-center justify-center gap-2 overflow-hidden rounded-md border border-dashed text-xs transition-colors",
                  pending
                    ? "cursor-not-allowed opacity-50"
                    : "hover:border-foreground/30 hover:bg-muted/40",
                )}
              >
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={coverPreview}
                    alt="표지 미리보기"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <>
                    <Upload className="size-5 text-muted-foreground" />
                    <span className="text-muted-foreground">표지 선택</span>
                  </>
                )}
              </label>
            </div>
          </div>

          {state.error ? (
            <p className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={pending}
            >
              취소
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "처리 중…" : isEdit ? "수정" : "등록"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
