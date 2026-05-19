"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { signIn, type SignInState } from "./actions";

const INITIAL_STATE: SignInState = {};

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, INITIAL_STATE);

  return (
    <form action={formAction}>
      <FieldGroup className="gap-5">
        <Field>
          <FieldLabel htmlFor="email">관리자 계정</FieldLabel>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="admin@thehim.school"
            autoComplete="email"
            required
            disabled={pending}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="password">비밀번호</FieldLabel>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            required
            disabled={pending}
          />
        </Field>
        {state.error ? <FieldError>{state.error}</FieldError> : null}
        <Button
          type="submit"
          disabled={pending}
          className="h-11 w-full text-base"
        >
          {pending ? "로그인 중…" : "로그인"}
        </Button>
      </FieldGroup>
    </form>
  );
}
