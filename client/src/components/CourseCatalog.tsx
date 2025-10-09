import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { Course } from '@/types';

interface CourseCardProps {
  course: Course;
  onEnroll: (courseId: string) => void;
  onPreview: (courseId: string) => void;
}

function CourseCard({ course, onEnroll, onPreview }: CourseCardProps) {
  const difficultyColors = {
    beginner: 'bg-success/20 text-success',
    intermediate: 'bg-secondary/20 text-secondary',
    advanced: 'bg-destructive/20 text-destructive'
  };

  const categoryColors = {
    'programming': 'bg-primary/20 text-primary',
    'data-science': 'bg-secondary/20 text-secondary',
    'design': 'bg-accent/20 text-accent',
    'business': 'bg-muted/20 text-muted-foreground',
    'devops': 'bg-primary/20 text-primary',
    'blockchain': 'bg-accent/20 text-accent'
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden hover-glow" data-testid={`card-course-${course.id}`}>
      {course.imageUrl && (
        <img 
          src={course.imageUrl} 
          alt={course.title}
          className="w-full h-48 object-cover" 
        />
      )}
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${categoryColors[course.category.toLowerCase() as keyof typeof categoryColors] || categoryColors.programming}`}>
            {course.category.toUpperCase()}
          </span>
          <div className="flex items-center space-x-1 text-accent">
            <i className="fas fa-star"></i>
            <span className="text-sm font-semibold" data-testid={`text-rating-${course.id}`}>{course.rating.toFixed(1)}</span>
          </div>
        </div>
        <h3 className="text-lg font-bold mb-2" data-testid={`text-title-${course.id}`}>{course.title}</h3>
        <p className="text-sm text-muted-foreground mb-4" data-testid={`text-description-${course.id}`}>
          {course.description}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <span><i className="fas fa-book-open mr-1"></i>{course.modules} Modules</span>
          <span><i className="fas fa-clock mr-1"></i>{course.estimatedHours} hours</span>
          <span><i className="fas fa-users mr-1"></i>{course.enrollmentCount.toLocaleString()} students</span>
        </div>
        <div className="mb-3">
          <span className={`px-2 py-1 text-xs font-semibold rounded ${difficultyColors[course.difficulty]}`}>
            {course.difficulty.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-all"
            onClick={() => onEnroll(course.id)}
            data-testid={`button-enroll-${course.id}`}
          >
            Enroll Now
          </button>
          <button 
            className="px-4 py-2 glass-card hover:bg-card border border-border rounded-lg"
            onClick={() => onPreview(course.id)}
            data-testid={`button-preview-${course.id}`}
          >
            <i className="fas fa-eye"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export function CourseCatalog() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/courses', selectedCategory],
    queryFn: async () => {
      const response = await fetch(`/api/courses?category=${selectedCategory}`);
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: string) => {
      await apiRequest('POST', `/api/courses/${courseId}/enroll`);
    },
    onSuccess: () => {
      toast({
        title: "Enrollment Successful!",
        description: "You've been enrolled in the course. Happy learning!",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/enrollments'] });
    },
    onError: (error) => {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnroll = (courseId: string) => {
    enrollMutation.mutate(courseId);
  };

  const handlePreview = (courseId: string) => {
    // This would open a course preview modal or navigate to preview page
    console.log('Preview course:', courseId);
  };

  const categories = [
    { id: 'all', label: 'All Courses' },
    { id: 'programming', label: 'Programming' },
    { id: 'data-science', label: 'Data Science' },
    { id: 'design', label: 'Design' },
    { id: 'business', label: 'Business' },
    { id: 'devops', label: 'DevOps' },
    { id: 'blockchain', label: 'Blockchain' }
  ];

  if (isLoading) {
    return (
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted/20 rounded w-64 mb-4"></div>
            <div className="h-4 bg-muted/20 rounded w-96 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="glass-card rounded-xl p-6 h-96"></div>
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-2">Explore Courses</h2>
          <p className="text-muted-foreground">Discover AI-powered learning paths tailored to your goals</p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCategory === category.id
                  ? 'bg-primary text-primary-foreground'
                  : 'glass-card hover:bg-card border border-border'
              }`}
              onClick={() => setSelectedCategory(category.id)}
              data-testid={`filter-${category.id}`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        {courses?.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
              <i className="fas fa-search text-4xl text-muted-foreground"></i>
            </div>
            <h3 className="text-xl font-semibold mb-2">No Courses Found</h3>
            <p className="text-muted-foreground">
              No courses available in the {categories.find(c => c.id === selectedCategory)?.label.toLowerCase()} category yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="courses-grid">
            {courses?.map((course: Course) => (
              <CourseCard
                key={course.id}
                course={course}
                onEnroll={handleEnroll}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
