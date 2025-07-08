import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchoolStore } from '../stores/schoolStore';
import { useUniformStore } from '../stores/uniformStore';
import toast from 'react-hot-toast';
import { FiArrowLeft, FiSave, FiPlus, FiTrash2 } from 'react-icons/fi';
import UniformDistributionTable from '../components/students/UniformDistributionTable';

const ManageStudentUniforms = () => {
  const { schoolId, studentId } = useParams();
  const navigate = useNavigate();

  // State for data
  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [uniformRequirements, setUniformRequirements] = useState([]);
  const [availableUniforms, setAvailableUniforms] = useState([]);
  const [uniformDistribution, setUniformDistribution] = useState({});
  
  // State for UI
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Zustand stores
  const { getSchoolById, updateStudent: updateStudentInSchool } = useSchoolStore();
  const { uniforms: allUniforms, fetchUniforms } = useUniformStore();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const schoolData = await getSchoolById(schoolId);
        if (!schoolData) throw new Error("School not found");
        
        const studentData = schoolData.students?.find(s => s.id === studentId);
        if (!studentData) throw new Error("Student not found");

        setSchool(schoolData);
        setStudent(studentData);
        
        // This is the new data structure we'll be using.
        // We initialize it from the student data or as an empty object.
        setUniformDistribution(studentData.uniformDistribution || {});

        // Fetch all uniforms if not already in store
        if (allUniforms.length === 0) {
            await fetchUniforms();
        }
        setAvailableUniforms(allUniforms);

        // Determine student's uniform requirements
        const level = studentData.level || 'JUNIOR';
        const gender = studentData.gender === 'MALE' ? 'BOYS' : 'GIRLS';
        const requirements = schoolData.uniformRequirements?.[level]?.[gender] || [];
        setUniformRequirements(requirements);

      } catch (err) {
        toast.error(`Failed to load data: ${err.message}`);
        navigate(`/schools/${schoolId}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId, studentId, getSchoolById, navigate, allUniforms, fetchUniforms]);


  const handleDistributionChange = (newDistribution) => {
    setUniformDistribution(newDistribution);
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const studentToUpdate = {
        ...student,
        id: studentId,
        uniformDistribution: uniformDistribution,
        updatedAt: new Date().toISOString(),
      };

      await updateStudentInSchool(schoolId, studentToUpdate);
      toast.success('Uniform distribution updated successfully!');
      
    } catch (err) {
      toast.error('Failed to save changes.');
      console.error('Error saving changes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div>Loading student uniform data...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white mb-2">
              <FiArrowLeft />
              Back
            </button>
            <h1 className="text-3xl font-bold">Manage Uniforms</h1>
            {student && <p className="text-gray-400">For {student.name}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors"
            >
              <FiSave />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
        
        {/* We will replace this with the actual table */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
           <UniformDistributionTable 
            requirements={uniformRequirements}
            studentData={student}
            availableUniforms={availableUniforms}
            initialDistribution={uniformDistribution}
            onDistributionChange={handleDistributionChange}
           />
        </div>
      </div>
    </div>
  );
};

export default ManageStudentUniforms; 