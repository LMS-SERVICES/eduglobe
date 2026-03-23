import CourseFormWizard from '../../CourseFormWizard'

export default function EditCoursePage({ params }: { params: { id: string } }) {
  return <CourseFormWizard mode="edit" courseId={params.id} />
}
