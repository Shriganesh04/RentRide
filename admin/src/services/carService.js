import adminApi from './adminApi';

export const carService = {
  // Get all cars
  getAllCars: async (filters = {}) => {
    const response = await adminApi.get('/cars', { params: filters });
    return response.data;
  },

  // Get single car
  getCarById: async (id) => {
    const response = await adminApi.get(`/cars/${id}`);
    return response.data;
  },

  // Create car
  createCar: async (carData) => {
    const response = await adminApi.post('/cars', carData);
    return response.data;
  },

  // Update car
  updateCar: async (id, carData) => {
    const response = await adminApi.put(`/cars/${id}`, carData);
    return response.data;
  },

  // Delete car
  deleteCar: async (id) => {
    const response = await adminApi.delete(`/cars/${id}`);
    return response.data;
  },

  // Upload car images to Cloudinary — returns array of hosted URLs.
  // Works for both new (unsaved) and existing cars since it doesn't need a carId.
  uploadCarImages: async (images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await adminApi.post('/cars/upload-images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove a single uploaded image from Cloudinary by its URL
  deleteCarImage: async (url) => {
    const response = await adminApi.delete('/cars/upload-images', { data: { url } });
    return response.data;
  },
};