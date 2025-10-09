import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/Layout";
import CourseCard from "@/components/CourseCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

const categories = [
  { id: "all", label: "All Courses" },
  { id: "programming", label: "Programming" },
  { id: "data-science", label: "Data Science" },
  { id: "design", label: "Design" },
  { id: "business", label: "Business" },
  { id: "devops", label: "DevOps" },
  { id: "blockchain", label: "Blockchain" },
  { id: "ai-ml", label: "AI & ML" },
];

export default function Courses() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: courses, isLoading } = useQuery({
    queryKey: ["/api/courses", { category: selectedCategory }],
  });

  const filteredCourses = courses?.filter((course: any) =>
    course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <Layout>
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
              Explore Courses
            </h1>
            <p className="text-muted-foreground">
              Discover AI-powered learning paths tailored to your goals
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-courses"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
          </div>

          {/* Category Filter */}
          <div className="flex flex-wrap gap-3 mb-8">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                onClick={() => setSelectedCategory(category.id)}
                className={selectedCategory === category.id ? "shadow-lg shadow-primary/20" : ""}
                data-testid={`filter-${category.id}`}
              >
                {category.label}
              </Button>
            ))}
          </div>

          {/* Course Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-6">
                    <div className="h-4 bg-muted rounded mb-2" />
                    <div className="h-3 bg-muted rounded mb-4" />
                    <div className="flex justify-between mb-4">
                      <div className="h-3 bg-muted rounded w-16" />
                      <div className="h-3 bg-muted rounded w-16" />
                    </div>
                    <div className="h-8 bg-muted rounded" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="p-12 text-center">
                <div className="text-6xl text-muted-foreground mb-4">📚</div>
                <h3 className="text-xl font-semibold mb-2">No courses found</h3>
                <p className="text-muted-foreground">
                  {searchQuery 
                    ? "Try adjusting your search terms or browse different categories"
                    : "No courses available in this category yet"
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course: any) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
