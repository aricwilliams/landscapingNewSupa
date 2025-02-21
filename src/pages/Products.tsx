import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Stack,
  MenuItem,
  Chip,
} from '@mui/material';
import { Plus, Edit2, Trash2, Leaf, Trees as Tree, Shovel, Scissors, SprayCan as Spray, Ruler, CloudRain, Sun } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const availableIcons = [
  { name: 'Leaf', icon: <Leaf size={24} /> },
  { name: 'Tree', icon: <Tree size={24} /> },
  { name: 'Shovel', icon: <Shovel size={24} /> },
  { name: 'Scissors', icon: <Scissors size={24} /> },
  { name: 'Spray', icon: <Spray size={24} /> },
  { name: 'Ruler', icon: <Ruler size={24} /> },
  { name: 'Rain', icon: <CloudRain size={24} /> },
  { name: 'Sun', icon: <Sun size={24} /> },
];

interface Product {
  id: string;
  name: string;
  description: string;
  icon: string;
  base_price: number;
  estimated_hours: number;
  category: string;
}

interface ProductFormData {
  name: string;
  description: string;
  icon: string;
  base_price: number;
  estimated_hours: number;
  category: string;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  icon: 'Leaf',
  base_price: 0,
  estimated_hours: 1,
  category: 'maintenance',
};

const categories = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'installation', label: 'Installation' },
  { value: 'design', label: 'Design' },
  { value: 'cleanup', label: 'Cleanup' },
];

export const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        icon: product.icon,
        base_price: product.base_price,
        estimated_hours: product.estimated_hours,
        category: product.category,
      });
      setEditingId(product.id);
    } else {
      setFormData(initialFormData);
      setEditingId(null);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    try {
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update(formData)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('products')
          .insert([formData]);

        if (error) throw error;
      }

      handleCloseDialog();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async () => {
    if (!deletingProduct) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', deletingProduct.id);

      if (error) throw error;

      setIsDeleteDialogOpen(false);
      setDeletingProduct(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const handleDeleteClick = (product: Product) => {
    setDeletingProduct(product);
    setIsDeleteDialogOpen(true);
  };

  const getIconComponent = (iconName: string) => {
    return availableIcons.find(icon => icon.name === iconName)?.icon || <Leaf size={24} />;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 2 }}>
          Products & Services
        </Typography>
        <Button
          variant="contained"
          startIcon={<Plus size={20} />}
          onClick={() => handleOpenDialog()}
        >
          Add New Service
        </Button>
      </Box>

      <Grid container spacing={3}>
        {products.map((product) => (
          <Grid item xs={12} sm={6} md={4} key={product.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ mr: 2 }}>
                    {getIconComponent(product.icon)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="h6">{product.name}</Typography>
                    <Chip
                      label={categories.find(c => c.value === product.category)?.label}
                      size="small"
                      color="primary"
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Box>
                  <Box>
                    <IconButton
                      size="small"
                      onClick={() => handleOpenDialog(product)}
                      sx={{ mr: 1 }}
                    >
                      <Edit2 size={18} />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteClick(product)}
                    >
                      <Trash2 size={18} />
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {product.description}
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Base Price
                    </Typography>
                    <Typography variant="h6">${product.base_price}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Est. Hours
                    </Typography>
                    <Typography variant="h6">{product.estimated_hours}h</Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Add/Edit Dialog */}
      <Dialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingId ? 'Edit Service' : 'Add New Service'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <TextField
              fullWidth
              label="Description"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              select
              fullWidth
              label="Icon"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            >
              {availableIcons.map((icon) => (
                <MenuItem key={icon.name} value={icon.name}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {icon.icon}
                    <Typography sx={{ ml: 1 }}>{icon.name}</Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              fullWidth
              label="Category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              {categories.map((category) => (
                <MenuItem key={category.value} value={category.value}>
                  {category.label}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Base Price"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: Number(e.target.value) })}
              InputProps={{
                startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
              }}
            />
            <TextField
              fullWidth
              type="number"
              label="Estimated Hours"
              value={formData.estimated_hours}
              onChange={(e) => setFormData({ ...formData, estimated_hours: Number(e.target.value) })}
              InputProps={{
                endAdornment: <Typography sx={{ ml: 1 }}>hours</Typography>,
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!formData.name || !formData.description}
          >
            {editingId ? 'Save Changes' : 'Add Service'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};