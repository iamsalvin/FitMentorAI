import { Card, CardContent } from '@/components/ui/card';

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
  onClick?: () => void;
}

export default function FeatureCard({ icon, title, description, onClick }: FeatureCardProps) {
  return (
    <Card 
      className="transition-all duration-300 hover:scale-105 cursor-pointer bg-card hover:bg-accent/5"
      onClick={onClick}
    >
      <CardContent className="p-6 text-center space-y-4">
        <div className="w-16 h-16 mx-auto mb-4 relative">
          <div className="absolute inset-0 bg-primary/10 rounded-full" />
            <img 
            src={icon}
              alt={title}
            className="w-full h-full object-contain relative z-10 p-2"
          />
        </div>
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}