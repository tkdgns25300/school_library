"use client";

import { useMemo, useState } from "react";
import { BookPlus, Pencil, Trash2, Upload } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import type { Language } from "@/types/domain";

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

export function BooksView({ books }: { books: Book[] }) {
  const [search, setSearch] = useState("");
  const [formDialog, setFormDialog] = useState<FormDialog>(null);
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const koBooks = useMemo(() => books.filter((b) => b.language === "ko"), [books]);
  const enBooks = useMemo(() => books.filter((b) => b.language === "en"), [books]);

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

  return (
    <>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">책 목록</h2>
          <p className="text-sm text-muted-foreground">
            전체 {books.length}권 · 한국어 {koBooks.length}권 · 영어 {enBooks.length}권
          </p>
        </div>
        <div className="flex items-center gap-2">
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="ko">
              한국어 도서 · {koBooks.length}
            </TabsTrigger>
            <TabsTrigger value="en">
              English Books · {enBooks.length}
            </TabsTrigger>
          </TabsList>
          <Input
            placeholder="제목·저자·단계로 검색…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <TabsContent value="ko">
          <BooksTable
            language="ko"
            books={filterBy(koBooks)}
            totalCount={koBooks.length}
            onEdit={(book) => setFormDialog({ type: "edit", book })}
            onDelete={(book) => setDeleteTarget(book)}
          />
        </TabsContent>
        <TabsContent value="en">
          <BooksTable
            language="en"
            books={filterBy(enBooks)}
            totalCount={enBooks.length}
            onEdit={(book) => setFormDialog({ type: "edit", book })}
            onDelete={(book) => setDeleteTarget(book)}
          />
        </TabsContent>
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
  onEdit,
  onDelete,
}: {
  language: Language;
  books: Book[];
  totalCount: number;
  onEdit: (book: Book) => void;
  onDelete: (book: Book) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">표지</TableHead>
          <TableHead className="w-28">바코드</TableHead>
          <TableHead>제목 / 저자</TableHead>
          <TableHead>출판사</TableHead>
          <TableHead>{LANGUAGE_LEVEL_TERM[language]}</TableHead>
          <TableHead className="w-32 text-right">액션</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {books.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={6}
              className="text-center text-muted-foreground"
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
                <div
                  className={cn(
                    "flex h-14 w-10 items-center justify-center overflow-hidden rounded border text-[10px] font-semibold",
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
                    language.toUpperCase()
                  )}
                </div>
              </TableCell>
              <TableCell className="font-mono text-xs">{book.id}</TableCell>
              <TableCell>
                <div className="font-medium">{book.title}</div>
                {book.author ? (
                  <div className="text-xs text-muted-foreground">
                    {book.author}
                  </div>
                ) : null}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
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
  );
}
