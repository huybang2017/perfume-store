'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { vi } from '@/lib/i18n';

const REASONS = [
  { value: vi.order.cancelReasons.changeMind, key: 'changeMind' },
  { value: vi.order.cancelReasons.wrongProduct, key: 'wrongProduct' },
  { value: vi.order.cancelReasons.changeAddress, key: 'changeAddress' },
  { value: vi.order.cancelReasons.betterPrice, key: 'betterPrice' },
  { value: vi.order.cancelReasons.other, key: 'other' },
] as const;

interface CancelOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
}

export function CancelOrderDialog({
  open,
  onOpenChange,
  onConfirm,
  isLoading,
}: CancelOrderDialogProps) {
  const [reasonKey, setReasonKey] = useState<string>(REASONS[0].key);
  const [otherReason, setOtherReason] = useState('');

  const handleConfirm = () => {
    const preset = REASONS.find((r) => r.key === reasonKey);
    const reason =
      reasonKey === 'other'
        ? otherReason.trim() || vi.order.cancelReasons.other
        : preset?.value ?? vi.order.cancelReasons.other;
    if (reason.length < 3) return;
    onConfirm(reason);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{vi.order.cancelOrder}</DialogTitle>
          <DialogDescription>{vi.order.cancelConfirm}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="cancel-reason">{vi.order.cancelReason}</Label>
            <Select
              id="cancel-reason"
              value={reasonKey}
              onChange={(e) => setReasonKey(e.target.value)}
            >
              {REASONS.map((r) => (
                <option key={r.key} value={r.key}>
                  {r.value}
                </option>
              ))}
            </Select>
          </div>
          {reasonKey === 'other' && (
            <div className="space-y-2">
              <Label htmlFor="other-reason">{vi.order.cancelReasonOther}</Label>
              <Input
                id="other-reason"
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                placeholder={vi.order.cancelReasonOther}
              />
            </div>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
            {vi.common.cancel}
          </Button>
          <Button variant="danger" onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? vi.common.loading : vi.order.confirmCancel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
