"use client";

import { useMemo, useState, useTransition } from "react";
import {
  BookPlus,
  FileDown,
  Pencil,
  Search,
  Trash2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LANGUAGE_LABEL, LANGUAGE_LEVEL_TERM } from "@/constants/languages";
import { formatBookLevel } from "@/constants/levels";
import { downloadLabelsPdf } from "@/lib/download-labels";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

import type { BookWithStatus } from "@/lib/queries/books";

import { BookBarcodeDialog } from "./book-barcode-dialog";
import { BookDeleteDialog } from "./book-delete-dialog";
import { BookFormDialog } from "./book-form-dialog";
import { BooksCsvDialog } from "./books-csv-dialog";

type FormDialog =
  | { type: "create" }
  | { type: "edit"; book: BookWithStatus }
  | null;

function BookTab({
  value,
  language,
  count,
}: {
  value: string;
  language: Language;
  count: number;
}) {
  const isKo = language === "ko";
  return (
    <TabsTrigger
      value={value}
      className={cn(
        "group flex-none items-center gap-2 rounded-none border-0 border-b-[3px] border-transparent bg-transparent px-5 py-3 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground",
        "data-active:bg-transparent data-active:font-bold data-active:shadow-none",
        isKo
          ? "data-active:border-b-ko data-active:text-ko"
          : "data-active:border-b-en data-active:text-en",
      )}
    >
      <span>{LANGUAGE_LABEL[language].full}</span>
      <span
        className={cn(
          "rounded-full bg-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-muted-foreground transition-colors",
          isKo
            ? "group-data-active:bg-ko group-data-active:text-ko-foreground"
            : "group-data-active:bg-en group-data-active:text-en-foreground",
        )}
      >
        {count}
      </span>
    </TabsTrigger>
  );
}

export function BooksView({ books }: { books: BookWithStatus[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<BookWithStatus | null>(null);
  const [barcodeTarget, setBarcodeTarget] = useState<BookWithStatus | null>(
    null,
  );
  const [csvOpen, setCsvOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPrinting, startPrinting] = useTransition();

  const koBooks = useMemo(
    () => books.filter((b) => b.language === "ko"),
    [books],
  );
  const enBooks = useMemo(
    () => books.filter((b) => b.language === "en"),
    [books],
  );

  const filterBy = (list: BookWithStatus[]) => {
    const q = search.trim().toLowerCase();
    return list.filter((b) => {
      if (statusFilter === "available" && b.isActive) return false;
      if (statusFilter === "active" && !b.isActive) return false;
      if (q !== "") {
        const formatted = formatBookLevel(b.level, b.language);
        const matches =
          b.title.toLowerCase().includes(q) ||
          (b.author?.toLowerCase().includes(q) ?? false) ||
          (b.level?.toLowerCase().includes(q) ?? false) ||
          (formatted?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      return true;
    });
  };

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(list: BookWithStatus[], checked: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (checked) list.forEach((b) => next.add(b.id));
      else list.forEach((b) => next.delete(b.id));
      return next;
    });
  }

  function handlePrintSelected() {
    if (selected.size === 0) return;
    const selectedBooks = books.filter((b) => selected.has(b.id));
    startPrinting(async () => {
      await downloadLabelsPdf(selectedBooks);
    });
  }

  const selectedCount = selected.size;
  const labelButtonLabel =
    selectedCount === 0
      ? "라벨 PDF"
      : isPrinting
        ? "PDF 생성 중…"
        : `선택 ${selectedCount}권 라벨 PDF`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold tabular-nums">{books.length}</span>
          <span className="text-sm text-muted-foreground">권 등록</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            onClick={handlePrintSelected}
            disabled={selectedCount === 0 || isPrinting}
          >
            <FileDown className="size-4" />
            {labelButtonLabel}
          </Button>
          <Button variant="outline" onClick={() => setCsvOpen(true)}>
            <Upload className="size-4" />
            CSV 업로드
          </Button>
          <Button onClick={() => setFormDialog({ type: "create" })}>
            <BookPlus className="size-4" />
            책 등록
          </Button>
        </div>
      </div>

      <Tabs defaultValue="ko">
        <TabsList className="h-auto w-full justify-start rounded-none border-b bg-transparent p-0">
          <BookTab value="ko" language="ko" count={koBooks.length} />
          <BookTab value="en" language="en" count={enBooks.length} />
        </TabsList>

        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-full sm:max-w-md sm:flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="제목·저자·단계로 검색…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <StatusToggle value={statusFilter} onChange={setStatusFilter} />
          </div>

          <TabsContent value="ko" className="m-0">
            <BooksTable
              language="ko"
              books={filterBy(koBooks)}
              totalCount={koBooks.length}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onEdit={(book) => setFormDialog({ type: "edit", book })}
              onDelete={(book) => setDeleteTarget(book)}
              onBarcode={(book) => setBarcodeTarget(book)}
            />
          </TabsContent>
          <TabsContent value="en" className="m-0">
            <BooksTable
              language="en"
              books={filterBy(enBooks)}
              totalCount={enBooks.length}
              selected={selected}
              onToggle={toggle}
              onToggleAll={toggleAll}
              onEdit={(book) => setFormDialog({ type: "edit", book })}
              onDelete={(book) => setDeleteTarget(book)}
              onBarcode={(book) => setBarcodeTarget(book)}
            />
          </TabsContent>
        </div>
      </Tabs>

      {formDialog ? (
        <BookFormDialog
          mode={formDialog}
          open
          onOpenChange={(open) => {
            if (!open) setFormDialog(null);
          }}
        />
      ) : null}
      <BookDeleteDialog
        book={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      />
      <BookBarcodeDialog
        book={barcodeTarget}
        open={barcodeTarget !== null}
        onOpenChange={(open) => {
          if (!open) setBarcodeTarget(null);
        }}
      />
      {csvOpen ? (
        <BooksCsvDialog
          open
          onOpenChange={(open) => {
            if (!open) setCsvOpen(false);
          }}
        />
      ) : null}
    </>
  );
}

function StatusToggle({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { v: "all", label: "전체" },
    { v: "available", label: "대여 가능" },
    { v: "active", label: "대여 중" },
  ];
  return (
    <div className="inline-flex overflow-hidden rounded-md border bg-card">
      {options.map(({ v, label }, idx) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={cn(
            "px-3 py-1.5 text-sm font-medium transition-colors",
            idx > 0 && "border-l",
            value === v
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted/60",
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BooksTable({
  language,
  books,
  totalCount,
  selected,
  onToggle,
  onToggleAll,
  onEdit,
  onDelete,
  onBarcode,
}: {
  language: Language;
  books: BookWithStatus[];
  totalCount: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (list: BookWithStatus[], checked: boolean) => void;
  onEdit: (book: BookWithStatus) => void;
  onDelete: (book: BookWithStatus) => void;
  onBarcode: (book: BookWithStatus) => void;
}) {
  const allChecked = books.length > 0 && books.every((b) => selected.has(b.id));

  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-sm">
      <Table className="min-w-[880px] table-fixed">
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-12">
              <Checkbox
                checked={allChecked}
                onCheckedChange={(checked) =>
                  onToggleAll(books, checked === true)
                }
                aria-label="전체 선택"
                disabled={books.length === 0}
              />
            </TableHead>
            <TableHead className="w-16">표지</TableHead>
            <TableHead className="w-28">바코드</TableHead>
            <TableHead>제목 / 저자</TableHead>
            <TableHead className="w-32">출판사</TableHead>
            <TableHead className="w-24">
              {LANGUAGE_LEVEL_TERM[language]}
            </TableHead>
            <TableHead className="w-24">상태</TableHead>
            <TableHead className="w-24 text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={8}
                className="py-12 text-center text-muted-foreground"
              >
                {totalCount === 0
                  ? "아직 등록된 책이 없습니다."
                  : "검색 결과가 없습니다."}
              </TableCell>
            </TableRow>
          ) : (
            books.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(book.id)}
                    onCheckedChange={() => onToggle(book.id)}
                    aria-label={`${book.title} 선택`}
                  />
                </TableCell>
                <TableCell>
                  <div
                    className={cn(
                      "flex h-14 w-10 items-center justify-center overflow-hidden rounded-md",
                      language === "ko"
                        ? "bg-ko text-ko-foreground"
                        : "bg-en text-en-foreground",
                    )}
                  >
                    {book.cover_image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={book.cover_image_url}
                        alt={book.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-0.5 p-1 text-[8px] font-semibold leading-tight">
                        <span className="uppercase">
                          {language.toUpperCase()}
                        </span>
                        <span className="line-clamp-2 text-center">
                          {book.title}
                        </span>
                        {book.level ? (
                          <span className="opacity-80">
                            {formatBookLevel(book.level, language)}
                          </span>
                        ) : null}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    type="button"
                    onClick={() => onBarcode(book)}
                    className="cursor-pointer truncate font-mono text-xs text-primary transition-colors hover:underline"
                  >
                    {book.id}
                  </button>
                </TableCell>
                <TableCell>
                  <div className="truncate font-medium">{book.title}</div>
                  {book.author ? (
                    <div className="truncate text-xs text-muted-foreground">
                      {book.author}
                    </div>
                  ) : null}
                </TableCell>
                <TableCell className="truncate text-sm text-muted-foreground">
                  {book.publisher ?? "—"}
                </TableCell>
                <TableCell>
                  {book.level ? (
                    <Badge variant="secondary">
                      {formatBookLevel(book.level, language)}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge isActive={book.isActive} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(book)}
                    aria-label="수정"
                  >
                    <Pencil className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(book)}
                    aria-label="삭제"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        대여 중
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
      대여 가능
    </span>
  );
}
