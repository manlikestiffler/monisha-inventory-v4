import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSchoolStore } from '../stores/schoolStore';
import { useUniformStore } from '../stores/uniformStore';
import { FiArrowLeft, FiUser, FiInfo, FiClipboard, FiPackage, FiCalendar, FiCheckSquare } from 'react-icons/fi';
import LoadingScreen from '../components/ui/LoadingScreen';

const StudentDetailsPage = () => {
  const { schoolId, studentId } = useParams();
  const navigate = useNavigate();
  const { getSchoolById } = useSchoolStore();
  const { uniforms: availableUniforms, fetchUniforms } = useUniformStore();

  const [student, setStudent] = useState(null);
  const [school, setSchool] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        if (availableUniforms.length === 0) {
          await fetchUniforms();
        }
        const schoolData = await getSchoolById(schoolId);
        if (schoolData) {
          setSchool(schoolData);
          const studentData = schoolData.students?.find(s => s.id === studentId);
          if (studentData) {
            setStudent(studentData);
          } else {
            setError('Student not found.');
          }
        } else {
          setError('School not found.');
        }
      } catch (err) {
        setError('Failed to fetch data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [schoolId, studentId, getSchoolById, fetchUniforms, availableUniforms]);

  useEffect(() => {
    if (student && school && availableUniforms.length > 0) {
      const generateHistory = () => {
        if (!student.uniformDistribution) {
          return [];
        }

        const historyLog = [];
        const level = student.level;
        const gender = student.gender === 'MALE' ? 'BOYS' : 'GIRLS';
        const requirements = school.uniformRequirements?.[level]?.[gender] || [];

        for (const key in student.uniformDistribution) {
          const distributionData = student.uniformDistribution[key];
          const keyParts = key.split('-');
          const reqIndex = parseInt(keyParts[keyParts.length - 1], 10);
          const requirement = requirements[reqIndex];

          if (requirement && distributionData.distributions) {
            const uniformDetails = availableUniforms.find(u => u.id === requirement.uniformId);
            const uniformName = uniformDetails?.name || 'Unknown Uniform';

            for (const item of distributionData.distributions) {
              historyLog.push({
                id: `${key}-${item.receivedAt}-${Math.random()}`,
                uniformName,
                ...item,
              });
            }
          }
        }
        return historyLog.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt));
      };
      setHistory(generateHistory());
    }
  }, [student, school, availableUniforms]);

  if (loading) {
    return <LoadingScreen message="Loading Student Details" description="Please wait while we fetch the student information" />;
  }

  if (error) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">Error: {error}</div>;
  }
  
  if (!student) {
     return <div className="flex items-center justify-center h-screen bg-gray-900 text-red-500">Student could not be loaded.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-400 hover:text-white">
            <FiArrowLeft />
            Back
          </button>
        </div>

        <div className="bg-gray-800 border border-gray-700 rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-shrink-0 h-16 w-16 flex items-center justify-center bg-slate-700 rounded-full text-2xl font-bold text-slate-200">
                {student.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{student.name}</h1>
                <p className="text-sm text-gray-400">ID: {student.id}</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InfoCard icon={<FiUser />} label="Gender" value={student.gender} />
              <InfoCard icon={<FiClipboard />} label="Level" value={student.level} />
              <InfoCard icon={<FiInfo />} label="Guardian's Phone" value={student.guardianPhone || 'N/A'} />
            </div>
          </div>
        </div>
        
        <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4">History</h2>
            <StudentHistory history={history} />
        </div>
      </div>
    </div>
  );
};

const StudentHistory = ({ history }) => {
  if (history.length === 0) {
    return <p className="text-gray-400">No uniform distribution history found for this student.</p>;
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-700/30 rounded-lg">
          <div className="mt-1">
            <FiCheckSquare className="w-5 h-5 text-green-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-white">
              <span className="font-bold">{item.quantity}x</span> {item.uniformName} ({item.size})
            </p>
            <p className="text-sm text-gray-400">
              Issued by {item.issuedBy || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-300">
              {new Date(item.receivedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            <p className="text-xs text-gray-500">
              {new Date(item.receivedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};

const InfoCard = ({ icon, label, value }) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
    <div className="text-blue-400">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{label}</p>
      <p className="text-white font-semibold">{value}</p>
    </div>
  </div>
);

export default StudentDetailsPage; 