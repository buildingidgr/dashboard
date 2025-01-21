declare module '@iconscout/react-unicons' {
  import { FC, SVGProps } from 'react'
  
  interface IconProps extends SVGProps<SVGElement> {
    size?: string | number
    color?: string
  }

  export const UilPlus: FC<IconProps>
  export const UilFileAlt: FC<IconProps>
  export const UilEllipsisV: FC<IconProps>
  export const UilUpload: FC<IconProps>
  export const UilDownload: FC<IconProps>
  export const UilTrashAlt: FC<IconProps>
  export const UilSearch: FC<IconProps>
  export const UilFilter: FC<IconProps>
  export const UilSpinner: FC<IconProps>
} 