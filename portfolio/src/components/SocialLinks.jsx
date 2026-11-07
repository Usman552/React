import { safeUrl } from "../lib/url";

/** Email + social profile links, shared by Contact and Footer. */
export default function SocialLinks({ email, socials, className }) {
  return (
    <div className={className}>
      {email && <a href={`mailto:${email}`}>Email</a>}
      {socials.map((item) => {
        const href = safeUrl(item.url);
        if (!href || !item.label) return null;
        return (
          <a key={`${item.label}-${href}`} href={href} target="_blank" rel="noreferrer">
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
