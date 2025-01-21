'use client';

import * as React from 'react';

import * as ToolbarPrimitive from '@radix-ui/react-toolbar';
import { cn, withCn, withRef, withVariants } from '@udecode/cn';
import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown } from 'lucide-react';

import { Separator } from './separator';
import { withTooltip } from './tooltip';

export const Toolbar = withCn(
  ToolbarPrimitive.Root,
  'relative flex select-none items-center'
);

export const ToolbarToggleGroup = withCn(
  ToolbarPrimitive.ToolbarToggleGroup,
  'flex items-center'
);

export const ToolbarLink = withCn(
  ToolbarPrimitive.Link,
  'font-medium underline underline-offset-4'
);

export const ToolbarSeparator = withCn(
  ToolbarPrimitive.Separator,
  'mx-2 my-1 w-px shrink-0 bg-border'
);

const toolbarButtonVariants = cva(
  cn(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium text-foreground ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg:not([data-icon])]:size-4'
  ),
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-3',
        lg: 'h-11 px-5',
        sm: 'h-7 px-2',
      },
      variant: {
        default:
          'bg-transparent hover:bg-muted hover:text-muted-foreground aria-checked:bg-accent aria-checked:text-accent-foreground',
        outline:
          'border border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
    },
  }
);

const dropdownArrowVariants = cva(
  cn(
    'inline-flex items-center justify-center rounded-r-md text-sm font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'
  ),
  {
    defaultVariants: {
      size: 'sm',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 w-6',
        lg: 'h-11 w-8',
        sm: 'h-7 w-4',
      },
      variant: {
        default:
          'bg-transparent hover:bg-muted hover:text-muted-foreground aria-checked:bg-accent aria-checked:text-accent-foreground',
        outline:
          'border border-l-0 border-input bg-transparent hover:bg-accent hover:text-accent-foreground',
      },
    },
  }
);

type ToolbarToggleItemProps = React.ComponentPropsWithoutRef<typeof ToolbarPrimitive.ToggleItem> & {
  pressed?: boolean;
  value?: string;
};

const BaseToolbarToggleItem = React.forwardRef<
  React.ElementRef<typeof ToolbarPrimitive.ToggleItem>,
  ToolbarToggleItemProps
>(({ className, children, pressed, value = 'toggle', ...props }, ref) => (
  <ToolbarPrimitive.ToggleItem
    ref={ref}
    className={cn(
      toolbarButtonVariants({ variant: 'default', size: 'sm' }),
      className
    )}
    value={value}
    {...props}
  >
    {children}
  </ToolbarPrimitive.ToggleItem>
));

BaseToolbarToggleItem.displayName = 'BaseToolbarToggleItem';

type ToolbarButtonProps = {
  isDropdown?: boolean;
  pressed?: boolean;
  size?: VariantProps<typeof toolbarButtonVariants>['size'];
  variant?: VariantProps<typeof toolbarButtonVariants>['variant'];
} & Omit<ToolbarToggleItemProps, 'asChild' | 'value'>;

const BaseToolbarButton = React.forwardRef<React.ElementRef<typeof BaseToolbarToggleItem>, ToolbarButtonProps>(
  ({ children, className, isDropdown, pressed, size, variant, ...props }, ref) => {
    const buttonProps = {
      className: cn(
        toolbarButtonVariants({ variant, size }),
        isDropdown && 'rounded-r-none',
        className
      ),
      ...props,
    };

    if (typeof pressed === 'boolean') {
      return (
        <ToolbarToggleGroup type="single" value={pressed ? 'pressed' : ''}>
          <BaseToolbarToggleItem ref={ref} pressed={pressed} value={pressed ? 'pressed' : ''} {...buttonProps}>
            {children}
          </BaseToolbarToggleItem>
        </ToolbarToggleGroup>
      );
    }

    return (
      <ToolbarPrimitive.Button ref={ref} {...buttonProps}>
        {children}
      </ToolbarPrimitive.Button>
    );
  }
);

BaseToolbarButton.displayName = 'BaseToolbarButton';

export const ToolbarButton = withTooltip(BaseToolbarButton);

export const ToolbarSplitButton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    pressed?: boolean;
    tooltip?: string;
  }
>(({ children, className, pressed, tooltip, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-pressed={pressed}
      className={cn('group flex gap-0 px-0', className)}
      {...props}
    >
      {children}
    </div>
  );
});

export const ToolbarSplitButtonPrimary = React.forwardRef<
  React.ElementRef<typeof ToolbarToggleItem>,
  Omit<React.ComponentPropsWithoutRef<typeof ToolbarToggleItem>, 'value'> & {
    value?: string;
  }
>(({ children, className, size, variant, value = 'toggle', ...props }, ref) => {
  return (
    <ToolbarToggleGroup type="single" value={value}>
      <WrappedToolbarToggleItem
        ref={ref}
        className={cn(
          toolbarButtonVariants({
            size,
            variant,
          }),
          'rounded-r-none',
          'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
          className
        )}
        value={value}
        {...props}
      >
        {children}
      </WrappedToolbarToggleItem>
    </ToolbarToggleGroup>
  );
});

ToolbarSplitButtonPrimary.displayName = 'ToolbarSplitButtonPrimary';

export const ToolbarSplitButtonSecondary = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> &
    VariantProps<typeof dropdownArrowVariants>
>(({ className, size, variant, ...props }, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      className={cn(
        dropdownArrowVariants({
          size,
          variant,
        }),
        'group-data-[pressed=true]:bg-accent group-data-[pressed=true]:text-accent-foreground',
        className
      )}
      onClick={(e) => e.stopPropagation()}
      {...props}
    >
      <ChevronDown className="size-3.5 text-muted-foreground" data-icon />
    </button>
  );
});

ToolbarSplitButtonSecondary.displayName = 'ToolbarSplitButtonSecondary';

const WrappedToolbarToggleItem = withVariants(
  ToolbarPrimitive.ToggleItem,
  toolbarButtonVariants,
  ['variant', 'size']
);

export const ToolbarToggleItem = React.forwardRef<
  React.ElementRef<typeof WrappedToolbarToggleItem>,
  React.ComponentPropsWithoutRef<typeof WrappedToolbarToggleItem>
>(({ value = 'toggle', ...props }, ref) => {
  return (
    <ToolbarToggleGroup type="single" value={value}>
      <WrappedToolbarToggleItem ref={ref} value={value} {...props} />
    </ToolbarToggleGroup>
  );
});

ToolbarToggleItem.displayName = 'ToolbarToggleItem';

export const ToolbarGroup = withRef<'div', {
  children: React.ReactNode;
  className?: string;
}>(({ children, className }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'group/toolbar-group',
        'relative hidden has-[button]:flex',
        className
      )}
    >
      <div className="flex items-center">{children}</div>

      <div className="mx-1.5 py-0.5 group-last/toolbar-group:!hidden">
        <Separator orientation="vertical" />
      </div>
    </div>
  );
});
