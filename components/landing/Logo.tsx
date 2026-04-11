type Props = {
  className?: string;
  width?: number;
  height?: number;
};

export default function Logo({ className, width = 34, height = 23 }: Props) {
  return (
    <img
      src="/logo.svg"
      alt="Sahaya Logo"
      width={width}
      height={height}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
