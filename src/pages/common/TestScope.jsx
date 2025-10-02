import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Search, Filter, Download, Plus, Edit, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { apiRequest, API_URLS } from "@/config/api";
import { ComboboxWithAdd } from "@/components/ui/combobox-with-add";

const TestScope = () => {
  const [testScopes, setTestScopes] = useState([]);
  const [filteredScopes, setFilteredScopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGroup, setFilterGroup] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingScope, setEditingScope] = useState(null);
  const [deletingScope, setDeletingScope] = useState(null);
  const [formData, setFormData] = useState({
    s_no: '',
    group: '',
    main_group: '',
    sub_group: '',
    material_tested: '',
    parameters: '',
    test_method: ''
  });
  const { toast } = useToast();

  // Extract unique values for dropdowns
  const uniqueGroups = React.useMemo(() => {
    return [...new Set(testScopes.map(scope => scope.group).filter(Boolean))].sort();
  }, [testScopes]);

  const uniqueMainGroups = React.useMemo(() => {
    return [...new Set(testScopes.map(scope => scope.main_group).filter(Boolean))].sort();
  }, [testScopes]);

  const uniqueSubGroups = React.useMemo(() => {
    return [...new Set(testScopes.map(scope => scope.sub_group).filter(Boolean))].sort();
  }, [testScopes]);

  const uniqueMaterialsTested = React.useMemo(() => {
    return [...new Set(testScopes.map(scope => scope.material_tested).filter(Boolean))].sort();
  }, [testScopes]);

  useEffect(() => {
    fetchTestScopes();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchTerm, filterGroup, testScopes]);

  const fetchTestScopes = async () => {
    try {
      setLoading(true);
      const response = await apiRequest(API_URLS.getTestScopes);
      setTestScopes(response.data || []);
      setFilteredScopes(response.data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch test scopes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    let filtered = testScopes;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(scope => 
        scope.material_tested?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.parameters?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.test_method?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.main_group?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        scope.sub_group?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply group filter
    if (filterGroup) {
      filtered = filtered.filter(scope => 
        scope.main_group?.toLowerCase().includes(filterGroup.toLowerCase())
      );
    }

    setFilteredScopes(filtered);
  };

  const handleOpenDialog = (scope = null) => {
    if (scope) {
      setEditingScope(scope);
      setFormData({
        s_no: scope.s_no || '',
        group: scope.group || '',
        main_group: scope.main_group || '',
        sub_group: scope.sub_group || '',
        material_tested: scope.material_tested || '',
        parameters: scope.parameters || '',
        test_method: scope.test_method || ''
      });
    } else {
      // Auto-fill S.No for new entry
      const maxSNo = testScopes.length > 0 
        ? Math.max(...testScopes.map(s => s.s_no || 0))
        : 0;
      
      setEditingScope(null);
      setFormData({
        s_no: maxSNo + 1,
        group: '',
        main_group: '',
        sub_group: '',
        material_tested: '',
        parameters: '',
        test_method: ''
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingScope(null);
    setFormData({
      s_no: '',
      group: '',
      main_group: '',
      sub_group: '',
      material_tested: '',
      parameters: '',
      test_method: ''
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation - All fields required with detailed checking
    const missingFields = [];
    
    if (!formData.s_no) missingFields.push("S.No");
    if (!formData.group || formData.group.trim() === '') missingFields.push("Group");
    if (!formData.main_group || formData.main_group.trim() === '') missingFields.push("Main Group");
    if (!formData.sub_group || formData.sub_group.trim() === '') missingFields.push("Sub Group");
    if (!formData.material_tested || formData.material_tested.trim() === '') missingFields.push("Material Tested");
    if (!formData.parameters || formData.parameters.trim() === '') missingFields.push("Parameters");
    if (!formData.test_method || formData.test_method.trim() === '') missingFields.push("Test Method");
    
    if (missingFields.length > 0) {
      toast({
        title: "Validation Error",
        description: `Please fill in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (editingScope) {
        // Update existing test scope
        const response = await apiRequest(API_URLS.updateTestScope(editingScope._id), {
          method: 'PUT',
          body: JSON.stringify(formData)
        });

        toast({
          title: "Success",
          description: "Test scope updated successfully",
        });
      } else {
        // Create new test scope
        const response = await apiRequest(API_URLS.createTestScope, {
          method: 'POST',
          body: JSON.stringify(formData)
        });

        toast({
          title: "Success",
          description: "Test scope created successfully",
        });
      }

      handleCloseDialog();
      fetchTestScopes();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to save test scope",
        variant: "destructive",
      });
    }
  };

  const handleOpenDeleteDialog = (scope) => {
    setDeletingScope(scope);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setIsDeleteDialogOpen(false);
    setDeletingScope(null);
  };

  const handleDelete = async () => {
    if (!deletingScope) return;

    try {
      await apiRequest(API_URLS.deleteTestScope(deletingScope._id), {
        method: 'DELETE'
      });

      toast({
        title: "Success",
        description: "Test scope deleted successfully",
      });

      handleCloseDeleteDialog();
      fetchTestScopes();
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete test scope",
        variant: "destructive",
      });
    }
  };

  const handleExport = () => {
    // Create CSV content
    const headers = ['S.No', 'Group', 'Main Group', 'Sub Group', 'Material Tested', 'Parameters', 'Test Method'];
    const csvContent = [
      headers.join(','),
      ...filteredScopes.map(scope => [
        scope.s_no,
        `"${scope.group || ''}"`,
        `"${scope.main_group || ''}"`,
        `"${scope.sub_group || ''}"`,
        `"${scope.material_tested || ''}"`,
        `"${scope.parameters || ''}"`,
        `"${scope.test_method || ''}"`
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-scope-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Success",
      description: "Test scope data exported successfully",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Test Scope (NABL)</h1>
        <div className="flex gap-2">
          <Button onClick={() => handleOpenDialog()} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Add Test Scope
          </Button>
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by material, parameters, or test method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-3 h-4 w-4 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <select
                value={filterGroup}
                onChange={(e) => setFilterGroup(e.target.value)}
                className="pl-10 w-full h-10 border border-input bg-background rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Groups</option>
                {uniqueMainGroups.map((group, idx) => (
                  <option key={idx} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">S.No</TableHead>
                  <TableHead>Group</TableHead>
                  <TableHead>Main Group</TableHead>
                  <TableHead>Sub Group</TableHead>
                  <TableHead>Material Tested</TableHead>
                  <TableHead>Parameters</TableHead>
                  <TableHead>Test Method</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredScopes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No test scope data found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredScopes.map((scope, index) => (
                    <TableRow key={scope._id || index}>
                      <TableCell className="font-medium">{scope.s_no}</TableCell>
                      <TableCell>{scope.group || '-'}</TableCell>
                      <TableCell>{scope.main_group || '-'}</TableCell>
                      <TableCell>{scope.sub_group || '-'}</TableCell>
                      <TableCell>{scope.material_tested || '-'}</TableCell>
                      <TableCell>{scope.parameters || '-'}</TableCell>
                      <TableCell>{scope.test_method || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(scope)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDeleteDialog(scope)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="text-sm text-gray-600">
        Showing {filteredScopes.length} of {testScopes.length} test scopes
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen} modal={false}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingScope ? 'Edit Test Scope' : 'Add New Test Scope'}
            </DialogTitle>
            <DialogDescription>
              {editingScope 
                ? 'Update the test scope details below.' 
                : 'Enter the details for the new test scope.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="s_no" className="text-right">
                  S.No *
                </Label>
                <Input
                  id="s_no"
                  name="s_no"
                  type="number"
                  value={formData.s_no}
                  onChange={handleInputChange}
                  className="col-span-3 bg-gray-50"
                  required
                  readOnly={!editingScope}
                  title={!editingScope ? "Auto-generated serial number" : ""}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="group" className="text-right">
                  Group *
                </Label>
                <div className="col-span-3">
                  <ComboboxWithAdd
                    value={formData.group}
                    onChange={(value) => setFormData(prev => ({ ...prev, group: value }))}
                    options={uniqueGroups}
                    placeholder="Select or add group..."
                    emptyText="No groups found. Type to add new."
                    fieldName="group"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="main_group" className="text-right">
                  Main Group *
                </Label>
                <div className="col-span-3">
                  <ComboboxWithAdd
                    value={formData.main_group}
                    onChange={(value) => setFormData(prev => ({ ...prev, main_group: value }))}
                    options={uniqueMainGroups}
                    placeholder="Select or add main group..."
                    emptyText="No main groups found. Type to add new."
                    fieldName="main group"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="sub_group" className="text-right">
                  Sub Group *
                </Label>
                <div className="col-span-3">
                  <ComboboxWithAdd
                    value={formData.sub_group}
                    onChange={(value) => setFormData(prev => ({ ...prev, sub_group: value }))}
                    options={uniqueSubGroups}
                    placeholder="Select or add sub group..."
                    emptyText="No sub groups found. Type to add new."
                    fieldName="sub group"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="material_tested" className="text-right">
                  Material Tested *
                </Label>
                <div className="col-span-3">
                  <ComboboxWithAdd
                    value={formData.material_tested}
                    onChange={(value) => setFormData(prev => ({ ...prev, material_tested: value }))}
                    options={uniqueMaterialsTested}
                    placeholder="Select or add material..."
                    emptyText="No materials found. Type to add new."
                    fieldName="material"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="parameters" className="text-right">
                  Parameters *
                </Label>
                <Input
                  id="parameters"
                  name="parameters"
                  value={formData.parameters}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="test_method" className="text-right">
                  Test Method *
                </Label>
                <Input
                  id="test_method"
                  name="test_method"
                  value={formData.test_method}
                  onChange={handleInputChange}
                  className="col-span-3"
                  required
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {editingScope ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the test scope
              {deletingScope && ` "${deletingScope.material_tested}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCloseDeleteDialog}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestScope;
