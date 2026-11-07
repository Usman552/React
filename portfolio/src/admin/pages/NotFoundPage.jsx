import { Link } from "react-router";
import { EmptyState } from "../components/ui";

export default function NotFoundPage() {
  return (
    <EmptyState
      icon="search"
      title="Page not found"
      text="This admin page doesn't exist."
      action={
        <Link className="a-btn a-btn--primary" to="/admin">
          Go to overview
        </Link>
      }
    />
  );
}
