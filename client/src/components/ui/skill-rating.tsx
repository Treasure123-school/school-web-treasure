import { Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export const RATING_SCALE = {
  1: 'Poor',
  2: 'Fair',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent'
} as const;

export const RATING_SCALE_TEXT = '1 = Poor | 2 = Fair | 3 = Good | 4 = Very Good | 5 = Excellent';

interface SkillRatingItemProps {
  label: string;
  value: number;
  onRatingChange: (rating: number) => void;
  canEdit: boolean;
  skillKey: string;
}

export function SkillRatingItem({
  label,
  value,
  onRatingChange,
  canEdit,
  skillKey
}: SkillRatingItemProps) {
  if (!canEdit) {
    const isRated = value > 0;
    const ratingText = isRated ? RATING_SCALE[value as keyof typeof RATING_SCALE] : 'Not Rated';
    const ratingColor = !isRated ? 'text-muted-foreground italic' : 
                        value >= 4 ? 'text-green-600' : 
                        value >= 3 ? 'text-blue-600' : 
                        value >= 2 ? 'text-yellow-600' : 'text-red-600';
    
    return (
      <div className="flex items-center justify-between py-2 border-b border-muted last:border-b-0">
        <span className="text-sm text-muted-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <div
                key={star}
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-medium
                  ${star <= value 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted text-muted-foreground/50'}
                `}
              >
                {star}
              </div>
            ))}
          </div>
          <span className={`text-xs font-medium min-w-[60px] text-right ${ratingColor}`}>
            {ratingText}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2 px-3 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors">
      <span className="text-sm font-medium text-foreground flex-shrink-0 min-w-[140px]">{label}</span>
      <div className="flex gap-2 items-center flex-wrap justify-end">
        {[1, 2, 3, 4, 5].map((rating) => {
          const isSelected = value === rating;
          return (
            <button
              key={rating}
              onClick={() => onRatingChange(rating)}
              type="button"
              className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-primary text-primary-foreground shadow-md scale-105'
                  : 'bg-background border-2 border-muted text-muted-foreground hover:border-primary/50 hover:bg-primary/5'
              }`}
              title={`Rate ${label} as ${rating}`}
              data-testid={`skill-${skillKey}-${rating}`}
            >
              {rating}
            </button>
          );
        })}
      </div>
    </div>
  );
}

interface SkillsSectionProps {
  title: string;
  icon: React.ReactNode;
  items: Array<{ key: string; label: string }>;
  values: Record<string, number>;
  onRatingChange: (key: string, rating: number) => void;
  canEdit: boolean;
  onSave?: () => void;
  isSaving?: boolean;
  isDataLoading?: boolean;
  bgColor?: string;
}

export function SkillsSection({
  title,
  icon,
  items,
  values,
  onRatingChange,
  canEdit,
  onSave,
  isSaving = false,
  isDataLoading = false,
  bgColor = 'purple'
}: SkillsSectionProps) {
  return (
    <div className="space-y-3">
      {items.map(({ key, label }) => (
        <SkillRatingItem
          key={key}
          label={label}
          value={values[key] || 0}
          onRatingChange={(rating) => onRatingChange(key, rating)}
          canEdit={canEdit}
          skillKey={key}
        />
      ))}

      {canEdit && onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving || isDataLoading}
          size="sm"
          className="mt-4 w-full"
          data-testid="button-save-skills"
        >
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          {isDataLoading ? 'Loading...' : 'Save Skills'}
        </Button>
      )}

      <div className={`mt-4 p-3 bg-${bgColor}-50 dark:bg-${bgColor}-900/20 rounded-md`}>
        <p className="text-xs text-foreground font-semibold mb-1">Rating Scale:</p>
        <p className="text-xs text-muted-foreground">{RATING_SCALE_TEXT}</p>
      </div>
    </div>
  );
}
