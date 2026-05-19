-- Remove teacher tracking from loans. The teachers table itself stays for the roster page.
alter table loans drop column handled_by_teacher_id;
alter table loans drop column returned_by_teacher_id;
