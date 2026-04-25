export const PageHeader = ({
  title,
  description,
}: {
  title: React.ReactNode;
  description: React.ReactNode;
}) => {
  return (
    <div className="max-w-[500px] space-y-0.5">
      <h1 className="text-foreground text-xl font-[550]">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
};
