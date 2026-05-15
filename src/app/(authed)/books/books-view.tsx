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
import { LANGUAGE_LEVEL_TERM } from "@/constants/languages";
import { downloadLabelsPdf } from "@/lib/download-labels";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

import { BookBarcodeDialog } from "./book-barcode-dialog";
import { BookDeleteDialog } from "./book-delete-dialog";
import { BookFormDialog } from "./book-form-dialog";
import { BooksCsvDialog } from "./books-csv-dialog";

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

type FormDialog =
  | { type: "create" }
  | { type: "edit"; book: Book }
  | null;

const TAB_TRIGGER_CLASS =
  "flex-none rounded-none border-b-2 border-transparent bg-transparent px-4 py-2.5 text-sm font-medium text-muted-foreground shadow-none transition-colors data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none";

export function BooksView({ books }: { books: Book[] }) {
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [barcodeTarget, setBarcodeTarget] = useState<Book | null>(null);
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

  const filterBy = (list: Book[]) => {
    const q = search.trim().toLowerCase();
    if (q === "") return list;
    return list.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.author?.toLowerCase().includes(q) ?? false) ||
        (b.level?.toLowerCase().includes(q) ?? false),
    );
  };

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll(list: Book[], checked: boolean) {
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
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">책 목록</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            전체 {books.length}권 · 한국어 {koBooks.length}권 · 영어{" "}
            {enBooks.length}권
          </p>
        </div>
        <div className="flex items-center gap-2">
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
          <TabsTrigger value="ko" className={TAB_TRIGGER_CLASS}>
            한국어 도서 · {koBooks.length}
          </TabsTrigger>
          <TabsTrigger value="en" className={TAB_TRIGGER_CLASS}>
            English Books · {enBooks.length}
          </TabsTrigger>
        </TabsList>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <div className="relative max-w-md">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="제목·저자·단계로 검색…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
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
  books: Book[];
  totalCount: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: (list: Book[], checked: boolean) => void;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
  onBarcode: (book: Book) => void;
}) {
  const allChecked = books.length > 0 && books.every((b) => selected.has(b.id));

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
      <Table className="table-fixed">
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
            <TableHead className="w-40">출판사</TableHead>
            <TableHead className="w-28">
              {LANGUAGE_LEVEL_TERM[language]}
            </TableHead>
            <TableHead className="w-28 text-right">액션</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {books.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
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
                      "flex h-14 w-10 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-md p-1 text-[8px] font-semibold leading-tight",
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
                      <>
                        <span className="uppercase">
                          {language.toUpperCase()}
                        </span>
                        <span className="line-clamp-2 text-center">
                          {book.title}
                        </span>
                        {book.level ? (
                          <span className="opacity-80">{book.level}</span>
                        ) : null}
                      </>
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
                    <Badge variant="secondary">{book.level}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
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
