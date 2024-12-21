export default function ProjectHeader({ title, description }: { title: string, description: string }) {
    return (
      <div className="">
        <div className="ml-6 mt-4 mb-12 px-4 sm:px-6 lg:px-8">
          <div className="font-inter text-3xl font-bold">{title}</div>
          <div className="font-inter text-base text-gray-500">
            {description}
          </div>
        </div>
      </div>
    )
  }
  
  