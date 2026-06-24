import { redirect } from 'next/navigation'

type PageProps = {
  params: Promise<{ id: string }> | { id: string }
}

export default async function ExpensesRedirect({ params }: PageProps) {
  const { id } = await params
  redirect(`/dashboard/${id}/budget`)
}
